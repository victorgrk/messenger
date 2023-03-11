import { Channel, connect, Connection, Replies } from 'amqplib'
import { randomBytes } from 'crypto'
import { BrokerConfig, Callback, MessageOptions } from '../types'
import { valueFromPath } from './helpers'

const appId = '@vicgrk/messenger'

export class Broker {
  private rabbitMQ!: Connection
  private channel!: Channel
  private broadcastQueue!: Replies.AssertQueue
  private closing = false

  constructor(private opts: BrokerConfig, private exchange: string) { }

  async connect() {
    this.rabbitMQ = await connect(
      typeof this.opts === 'string' ? this.opts :
        `amqp://${this.opts.user || 'guest'}:${this.opts.password || 'guest'}@${this.opts.host || 'localhost'
        }:${this.opts.port || 5672}`
    )
    this.channel = await this.rabbitMQ.createChannel()
    await this.channel.prefetch(10)
    await this.assertExchange(this.exchange)
    await this.assertBroadcast()
    this.closing = false
  }
  async publish(key: string, data: unknown, options?: MessageOptions) {
    if (this.closing) {
      return
    }
    if (!this.channel) {
      await this.connect()
    }
    await this.send(key, data, options)
  }

  async listen<T>(cb: Callback<{ key: string; args: any }>) {
    if (this.closing) {
      return
    }
    if (!this.channel) {
      await this.connect()
    }
    this.channel.consume(this.broadcastQueue.queue, async (msg) => {
      if (!msg) {
        return
      }
      this.channel.ack(msg)
      const args: { data: T } = JSON.parse(msg.content.toString())
      const key = msg.fields.routingKey.replace(`${this.exchange}.`, '')
      try {
        cb({ key, args })
      } catch (error) {
        console.error(error)
      }
    })
    this.channel.consume(this.exchange, async (msg) => {
      if (!msg) {
        return
      }
      this.channel.ack(msg)
      let tmp: T | { data: T } = JSON.parse(msg.content.toString())
      if (msg.properties.appId === appId && typeof (<{ data: T }>tmp).data !== 'undefined') {
        tmp = (<{ data: T }>tmp).data
      }
      const args = <T>tmp
      const key = msg.fields.routingKey.replace(`${this.exchange}.`, '')
      if (!msg.properties.correlationId) {
        try {
          cb({ key, args })
        } catch (error) {
          console.error(error)
        }
      }
      else {
        try {
          const data = await cb({ key, args })
          this.channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify({ data: { error: null, data } })),
            {
              correlationId: msg.properties.correlationId,
            }
          )
        } catch (error) {
          this.channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify({ data: { error } })),
            {
              correlationId: msg.properties.correlationId,
            }
          )
        }
      }
    })
  }

  async broadcast(key: string, data: unknown) {
    if (this.closing) {
      return
    }
    if (!this.channel) {
      await this.connect()
    }
    const [exchange] = key.split('.')
    await this.channel.assertExchange(`${exchange}-broadcast`, 'fanout', { durable: true })
    const buffer = Buffer.from(JSON.stringify({ data }))
    this.channel.publish(`${exchange}-broadcast`, key, buffer, { appId })
  }

  async invoke<T>(key: string, data: unknown, options?: MessageOptions) {
    if (this.closing) {
      return
    }
    if (!this.channel) {
      await this.connect()
    }
    const correlationId = this.generateCorrelationId()
    const { queue } = await this.channel.assertQueue('', {
      exclusive: true,
      autoDelete: true,
      durable: false,
    })
    let opts: any = {
      ...options,
      appId,
      correlationId,
      replyTo: queue,
    }
    return new Promise<T>((resolve, reject) => {
      this.channel.consume(queue, (msg) => {
        if (!msg) {
          return
        }
        this.channel.ack(msg)
        this.channel.deleteQueue(queue)
        if (msg.properties.correlationId == correlationId) {
          const response = JSON.parse(msg.content.toString()).data as {
            error: Error | null
            data: T
          }
          if (response.error) {
            return reject(response.error)
          }
          resolve(response.data)
        }
      })
      this.send(key, data, opts)
    })
  }

  private async send(key: string, data: unknown, options?: MessageOptions) {
    const [exchange] = key.split('.')
    await this.assertExchange(exchange)
    let opts: any = {
      ...options,
      appId,
    }
    if (options?.deduplicationFieldPath) {
      opts['x-deduplication-header'] = valueFromPath(data, options.deduplicationFieldPath)
    }
    const buffer = Buffer.from(JSON.stringify({ data }))
    this.channel.publish(
      exchange,
      key,
      buffer,
      opts
    )
  }

  async close() {
    try {
      this.closing = false
      await this.channel.close()
      return await this.rabbitMQ.close()
    } catch (error) {
      return
    }
  }

  private async assertExchange(exchange: string) {
    await this.channel.assertExchange(exchange,
      (<any>this.opts)?.exhangeType || 'x-message-deduplication',
      <any>{
        durable: true,
        arguments: {
          'x-cache-size': 128,
          'x-cache-ttl': 1e3,
          'x-cache-persistence': 'memory'
        }
      }
    )
    await this.channel.assertQueue(exchange, {
      durable: true,
    })
    await this.channel.bindQueue(
      exchange,
      exchange,
      `${exchange}.*`
    )
    return
  }

  private async assertBroadcast() {
    await this.channel.assertExchange(`${this.exchange}-broadcast`, 'fanout', { durable: true })
    this.broadcastQueue = await this.channel.assertQueue('', {
      durable: false,
      exclusive: true,
    })
    await this.channel.bindQueue(
      this.broadcastQueue.queue,
      `${this.exchange}-broadcast`,
      '*'
    )
  }

  generateCorrelationId() {
    return randomBytes(4).toString('hex')
  }
}

import { Channel, connect, Connection } from 'amqplib'
import { randomBytes } from 'crypto'
import { BrokerConfig, Callback } from '../types'

export class Broker {
  private rabbitMQ!: Connection
  private channel!: Channel
  private closing = false

  constructor(private opts: BrokerConfig, private exchange: string) { }

  async connect() {
    this.rabbitMQ = await connect(
      `amqp://${this.opts.user || 'guest'}:${this.opts.password || 'guest'}@${this.opts.host || 'localhost'
      }:${this.opts.port || 5672}`
    )
    this.channel = await this.rabbitMQ.createChannel()
    await this.channel.prefetch(10)
    await this.assertExchange(this.exchange)
    this.closing = false
  }
  async publish(key: string, data: unknown) {
    if (this.closing) {
      return
    }
    if (!this.channel) {
      await this.connect()
    }
    const [exchange] = key.split('.')
    await this.assertExchange(exchange)
    const buffer = Buffer.from(JSON.stringify({ data }))
    this.channel.publish(exchange, key, buffer, {
      appId: '@vicgrk/messenger'
    })
  }

  async listen<T>(cb: Callback<{ key: string; args: any }>) {
    if (this.closing) {
      return
    }
    if (!this.channel) {
      await this.connect()
    }
    this.channel.consume(this.exchange, async (msg) => {
      if (!msg) {
        return
      }
      this.channel.ack(msg)
      let tmp: T | { data: T } = JSON.parse(msg.content.toString())
      if (msg.properties.appId === '@vicgrk/messenger' && typeof (<{ data: T }>tmp).data !== 'undefined') {
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

  async invoke<T>(key: string, data: unknown) {
    if (this.closing) {
      return
    }
    if (!this.channel) {
      await this.connect()
    }
    const [exchange] = key.split('.')
    await this.assertExchange(exchange)
    const correlationId = this.generateCorrelationId()
    const buffer = Buffer.from(JSON.stringify({ data, response: true }))
    const { queue } = await this.channel.assertQueue('', {
      exclusive: true,
      autoDelete: true,
      durable: false,
    })
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
      this.channel.publish(
        exchange,
        key,
        buffer,
        {
          correlationId,
          replyTo: queue,
          appId: '@vicgrk/messenger',

        }
      )
    })
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

  async assertExchange(exchange: string) {
    await this.channel.assertExchange(exchange, this.opts.exhangeType || 'fanout', { durable: true })
    await this.channel.assertQueue(exchange, {
      durable: true
    })
    await this.channel.bindQueue(
      exchange,
      exchange,
      `${exchange}.*`
    )
    return
  }
  generateCorrelationId() {
    return randomBytes(4).toString('hex')
  }
}

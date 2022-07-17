import { Channel, connect, Connection } from 'amqplib'
import { randomBytes } from 'crypto'
import { BrokerConfig, Callback } from '../types'

export class Broker {
  private rabbitMQ!: Connection
  private channel!: Channel
  private syncExhange: string
  private exhange: string

  constructor(private opts: BrokerConfig) {
    this.exhange = opts.appName
    this.syncExhange = opts.appName + '-sync'
  }

  async connect() {
    this.rabbitMQ = await connect(
      `amqp://${this.opts.user || 'guest'}:${this.opts.password || 'guest'}@${this.opts.host || 'localhost'
      }:${this.opts.port || 5672}`
    )
    this.channel = await this.rabbitMQ.createChannel()
    this.channel.prefetch(10)
    await this.startAsyncQueue()
    await this.startSyncQueue()
  }

  private async startAsyncQueue() {
    await this.channel.assertQueue(this.exhange, {
      durable: false,
    })
    await this.channel.assertExchange(
      this.exhange,
      this.opts.exhangeType || 'fanout',
      {
        durable: true,
      }
    )
    await this.channel.bindQueue(
      this.exhange,
      this.exhange,
      `${this.exhange}.*`
    )
  }

  private async startSyncQueue() {
    await this.channel.assertQueue(this.syncExhange, {
      durable: false,
    })
    await this.channel.bindQueue(
      this.syncExhange,
      this.exhange,
      `sync.${this.syncExhange}.*`
    )
  }

  async listen<T>(cb: Callback<{ key: string; args: any }>) {
    if (!this.channel) {
      await this.connect()
    }
    this.channel.consume(this.exhange, (msg) => {
      if (!msg) {
        return
      }
      this.channel.ack(msg)
      const args: T = JSON.parse(msg.content.toString()).data
      cb(null, {
        key: msg.fields.routingKey.replace(`${this.exhange}.`, ''),
        args,
      })
    })
  }

  async publish(key: string, data: unknown) {
    if (!this.channel) {
      await this.connect()
    }
    const exchange = key.split('.')[0]
    this.channel.publish(exchange, key, Buffer.from(JSON.stringify({ data })))
  }

  async handle<T>(cb: Callback<{ key: string; args: any }>) {
    if (!this.channel) {
      await this.connect()
    }
    this.channel.consume(this.syncExhange, async (msg) => {
      if (!msg) {
        return
      }
      this.channel.ack(msg)
      const args: T = JSON.parse(msg.content.toString()).data
      const key = msg.fields.routingKey.replace(`sync.${this.exhange}.`, '')
      try {
        const data = await cb(null, { key, args })
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
    })
  }

  async invoke<T>(key: string, data: unknown) {
    if (!this.channel) {
      await this.connect()
    }
    let replied = false
    const correlationId = randomBytes(4).toString('hex')
    const tmpQueue = await this.channel.assertQueue('', {
      exclusive: true,
      autoDelete: true,
      durable: false,
    })
    return new Promise<T>((resolve, reject) => {
      this.channel.consume(tmpQueue.queue, (msg) => {
        if (!msg) {
          return
        }
        this.channel.ack(msg)
        if (msg.properties.correlationId == correlationId) {
          const response = JSON.parse(msg.content.toString()).data as {
            error: unknown | null
            data: T
          }
          replied = true
          if (response.error) {
            return reject(response.error)
          }
          resolve(response.data)
          setTimeout(() => {
            if (!replied) {
              reject('timeout')
            }
          }, 10000)
        }
      })
      this.channel.publish(
        key.split('.')[0],
        `sync.${key}`,
        Buffer.from(JSON.stringify({ data })),
        {
          correlationId,
          replyTo: tmpQueue.queue,
        }
      )
    })
  }

  async close() {
    this.channel?.close?.()
  }
}

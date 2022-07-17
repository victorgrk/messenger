import { DI } from './core/di'
import { Broker } from './core/messenger'
import { Config } from './types'

export class MeshNode {
  private broker: Broker
  constructor(
    config: Config
  ) {
    DI.instance().setType(config.di)
    this.broker = new Broker(config.rabbit)
    this.broker.connect().then(() => {
      this.broker.handle((error, { key, args }) => new Promise((resolve, reject) => {
        if (error) {
          return reject(error)
        }
        // this.emit(key, args, (error: unknown | null, result) => {
        //   if (error) {
        //     return reject(error)
        //   }
        //   resolve(result)
        // })
      }))
    })
  }

  publish(type: string, data: any) {
    this.broker.publish(type, { ...data, type })
  }
  invoke<T>(type: string, data: any) {
    return this.broker.invoke<T>(type, { ...data, type })
  }

  close() {
    this.broker.close()
  }
}

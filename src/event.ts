import { DI } from './core/di'
import { Broker } from './core/messenger'
import { MetadataManager } from './core/metadata'
import { Config } from './types'

export class MeshNode {
  private broker: Broker
  constructor(
    config: Config
  ) {
    DI.instance().setType(config.di)
    this.broker = new Broker(config.rabbit)
    this.broker.connect().then(() => {
      this.broker.listen(({ key, args }) => {
        MetadataManager.trigger(key, args)
      })
      this.broker.handle((error: Error | null, { key, args }) =>
        MetadataManager.instance().trigger(key, args))
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

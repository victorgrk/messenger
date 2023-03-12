import { Service } from 'typedi'
import { Amqp, Message, Messenger, Origin } from '../../../..'

@Service()
export class DirectoryInformation {

  @Amqp('informations')
  async getDirectoryInformation(@Message('test') information: string, @Origin() origin: string) {
    return information + ' - ' + new Date().toISOString() + ' - ' + origin
  }

  loadFile() {
    Messenger.invoke('tsed-example.informations', { message: 'Hello World' })
      .then((e) => console.log(e))
      .catch(e => console.error(e))
  }

  publishHelp() {
    let i = 0
    setInterval(() => {
      Messenger.publish('tsed-example.counter', { message: 'Hello World', i })
      i++
    }, 200)
  }
}

import { Service } from 'typedi'
import { Amqp, Messenger } from '../../../..'

@Service()
export class DirectoryInformation {

  @Amqp('informations')
  async getDirectoryInformation(information: any) {
    return information.test
  }

  loadFile() {
    Messenger.invoke('tsed-example.informations', { message: 'Hello World' })
      .then((e) => console.log(e))
      .catch(e => console.error(e))
  }

  publishHelp() {
    let i = 0
    setInterval(() => {
      Messenger.publish('tsed-example.counter', { message: 'Hello World', i }, { deduplicationFieldPath: 'i' })
      i++
    }, 200)
  }
}

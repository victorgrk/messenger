import { Service } from 'typedi'
import { Amqp, Messenger } from '../../../..'

@Service()
export class DirectoryInformation {

  @Amqp('informations')
  async getDirectoryInformation(information: any) {
    console.log('Got message from queue', information)
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
      console.log('Publishing to counter', i)
      Messenger.publish('tsed-example.counter', { message: 'Hello World', i })
      i++
    }, 200)
  }


}

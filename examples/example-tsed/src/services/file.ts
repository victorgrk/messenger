import { Service } from '@tsed/di'
import { Amqp, Messenger } from '../../../..'

@Service()
export class FileInformationService {

  @Amqp('informations')
  async getFileInformation(filePath: any) {
    return { filePath }
  }

  async getDirectoryInformation() {
    const result = await Messenger.invoke('typedi-example.informations', { test: '121' })
    console.log(result)
    return
  }
}

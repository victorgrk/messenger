import 'reflect-metadata'
import Container from 'typedi'
import { importer, Messenger } from '../../..'
import { DirectoryInformation } from './services/directory'

importer(`${__dirname}/services/*.ts`).then(() => {
  Messenger.init({
    name: 'typedi-example',
    rabbit: {
      host: 'localhost',
    },
    di: Container
  })
  Container.get(DirectoryInformation).loadFile()
})

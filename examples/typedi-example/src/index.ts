import { join } from 'path'
import 'reflect-metadata'
import Container from 'typedi'
import { Messenger } from '../../..'
import { DirectoryInformation } from './services/directory'

Messenger.init({
  rootDir: join(__dirname, 'services'),
  name: 'typedi-example',
  rabbit: {
    host: 'localhost',
  },
  verbose: true,
  di: Container
})
Container.get(DirectoryInformation).publishHelp()

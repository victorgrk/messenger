import { join } from 'path'
import 'reflect-metadata'
import Container from 'typedi'
import { Messenger } from '../../..'

Messenger.init({
  // Load all amqp listenets from services directory
  rootDir: join(__dirname, 'services'),
  name: 'typedi-example',
  rabbit: {
    host: 'localhost',
  },
  verbose: true,
  di: Container
})
// Container.get(DirectoryInformation).publishHelp()

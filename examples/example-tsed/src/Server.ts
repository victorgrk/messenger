import "@tsed/ajv"
import { AfterInit, PlatformApplication } from "@tsed/common"
import { Configuration, Inject, InjectorService } from "@tsed/di"
import "@tsed/platform-express" // /!\ keep this import
import bodyParser from "body-parser"
import compress from "compression"
import cookieParser from "cookie-parser"
import cors from "cors"
import methodOverride from "method-override"
import { Messenger } from '../../..'
import { config } from "./config/index"
import * as rest from "./controllers/rest/index"

@Configuration({
  ...config,
  acceptMimes: ["application/json"],
  httpPort: process.env.PORT || 8083,
  httpsPort: false, // CHANGE
  componentsScan: false,
  mount: {
    "/rest": [
      ...Object.values(rest)
    ]
  },
  middlewares: [
    cors(),
    cookieParser(),
    compress({}),
    methodOverride(),
    bodyParser.json(),
    bodyParser.urlencoded({
      extended: true
    })
  ],
  exclude: [
    "**/*.spec.ts"
  ]
})
export class Server implements AfterInit {
  @Inject()
  protected app: PlatformApplication

  @Configuration()
  protected settings: Configuration

  @Inject()
  private injector: InjectorService

  $afterInit() {
    Messenger.getInstance().init({
      name: 'tsed-example',
      rabbit: {
        host: 'localhost',
      },
      di: this.injector
    })
  }
}

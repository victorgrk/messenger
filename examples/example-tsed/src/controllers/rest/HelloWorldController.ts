import { Controller } from "@tsed/di"
import { Get } from "@tsed/schema"
import { FileInformationService } from '../../services/file'

@Controller("/hello-world")
export class HelloWorldController {

  constructor(private file: FileInformationService) { }

  @Get("/")
  async get() {
    return await this.file.getDirectoryInformation()
  }
}

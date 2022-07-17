export class DI {
  private type!: Function

  static instance() {
    return di
  }

  async setType(type: 'typedi' | 'tsed') {
    switch (type) {
      case 'typedi':
        try {
          require.resolve('typedi')
          const typedi = (await import('typedi')).default
          this.type = typedi.get
          break
        } catch (e) {
          throw new Error('typedi is not installed')
        }
      case 'tsed':
        try {
          require.resolve('@tsed/di')
          const { InjectorService } = (await import('@tsed/di'))
          const service = new InjectorService()
          await service.load()
          this.type = service.get
          break
        } catch (e) {
          throw new Error('@tsed/di is not installed')
        }
    }
  }

  async get(target: any) {
    return await this.type(target)
  }
}

const di = new DI()

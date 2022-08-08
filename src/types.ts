export declare type Constructable<T> = new (...args: any[]) => T
export type Callback<I = any, O = any> = (
  result: I
) => O | Promise<O>

export interface BrokerConfig {
  host?: string
  port?: string | number
  user?: string
  password?: string
  exhangeType?: 'fanout' | 'direct' | 'topic' | 'headers' | 'match'
}

export interface Config {
  rootDir: string
  name: string
  rabbit: BrokerConfig
  di: {
    get: (target: any) => any
  }
}

export interface EventMetadata {
  target: Constructable<any>
  listener: Function
}

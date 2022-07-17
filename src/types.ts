export declare type Constructable<T> = new (...args: any[]) => T
export type Callback<I = any, O = any> = (
  error: unknown | null,
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
  name: string
  rabbit: BrokerConfig
  di: 'typedi' | 'tsed'
}

export interface EventMetadata {
  target: Constructable<any>
  listener: Function
}

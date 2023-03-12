import { Options } from 'amqplib'

export declare type Constructable<T> = new (...args: any[]) => T
export type Callback<I = any, O = any> = (
  result: I
) => O | Promise<O>

export type BrokerConfig = string | {
  host?: string
  port?: string | number
  user?: string
  password?: string
  exhangeType?: string
}

export interface Config {
  rootDir: string
  name: string
  verbose?: boolean,
  rabbit: BrokerConfig
  di: {
    get: (target: any) => any
  }
}

export interface EventMetadata {
  target: Constructable<any>
  listener: string
}

export type EventParamType = 'message' | 'origin'

export interface EventParamMetadata {
  index: number
  param: EventParamType
  options?: EventParamOptions
}

export interface EventParamOptions {
  path?: string
}

export type MessageOptions = Options.Publish & {
  // deduplicationFieldPath?: string
}

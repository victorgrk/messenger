export type Callback<I = any, O = any> = (
  error: unknown | null,
  result: I
) => O | Promise<O>

export interface BrokerConfig {
  host?: string
  port?: string | number
  user?: string
  password?: string
  appName: string
  exhangeType?: 'fanout' | 'direct' | 'topic' | 'headers' | 'match'
}

export interface Config {
  rabbit: BrokerConfig
  di: 'typedi' | 'tsed'
}

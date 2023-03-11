# @vicgrk/messenger

> Send message and response to event with ts decorators

## Before start

This library use a rabbitmq instance to communicate with the [deduplication plugin enable](https://github.com/noxdafox/rabbitmq-message-deduplication).

## Installation

Warning, this package is not a DI manager and use other Dependency Injection manager to function properly. You can run this library with:

- [typedi](https://npmjs.com/packages/typedi)
- [TSED api environment](https://tsed.io/)

The author will try to add support for new depency injectors in the futures.

You can install the package with just

```sh
npm i --save @vicgrk/messenger
```

## Documentation

You can start the amqp lib by initializing the Messenger singleton

### TypeDI

Init your Messenger in the entrypoint of your app (index.ts) :

```typescript
import Container, { Service } from "typedi";
import { Messenger } from "@vicgrk/messenger";

Messenger.init({
  rootDir: __dirname,
  name: "my-node-name",
  verbose: process.env.NODE_ENV !== "production",
  rabbit: {
    host: process.env.RABBITMQ_HOST,
    port: process.env.RABBITMQ_PORT,
    user: process.env.RABBITMQ_USER,
    password: process.env.RABBITMQ_PASSWORD,
  },
  di: Container,
});
```

### TSED.io

For tsed, you can init your Messenger in your main configuration

```typescript
import { AfterInit } from "@tsed/common";
import { Configuration, Inject, InjectorService } from "@tsed/di";
import { Messenger } from "@vicgrk/messenger";

@Module()
export class Server implements AfterInit {
  @Inject()
  private injector: InjectorService;

  $afterInit() {
    Messenger.init({
      rootDir: __dirname,
      name: "my-node-name",
      verbose: process.env.NODE_ENV !== "production",
      rabbit: {
        host: process.env.RABBITMQ_HOST,
        port: process.env.RABBITMQ_PORT,
        user: process.env.RABBITMQ_USER,
        password: process.env.RABBITMQ_PASSWORD,
      },
      di: this.injector,
    });
  }
}
```

### Configuration

> Library configuration object

| Name    | Default                | Description                                                                              |
| ------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| rabbit  | see below the defaults | The rabbitmq credentials used to connect to the server                                   |
| di      | undefined              | The di service usued in this package.                                                    |
| name    | undefined              | The service name of your application, usued to receive message from other services       |
| verbose | false                  | Logs every transactions and payloads                                                     |
| rootDir | undefined              | The root directory where you implement your @Amqp decorators (get folder and subfolders) |

> RabbitMQ configuration object

| Name     | Default   | Description                               |
| -------- | --------- | ----------------------------------------- |
| host     | localhost | The IP or hostname of the rabbitmq server |
| port     | 5672      | The port of the rabbitmq server           |
| user     | guest     | The user of the rabbitmq server           |
| password | guest     | The password of the rabbitmq server       |

### How to use

> To emit to rabbitmq

```typescript
import { Messenger } from "@vicgrk/messenger";

@Service()
export class MyService {
  async getMemberInformation(memberId: string) {
    const member = await Messenger.invoke<{ user: string }>(
      "payment.member-informations",
      {
        memberId,
      }
    );
    // you should receive an object from the payment service running in a different application.
  }

  // If you just send data, without receiving anything, you can call the publish method. It's much smaller in compute requirements (avoid the round trip)
  sendUserUpdate(user: unknown) {
    Messenger.publish("users.update-user", user);
  }

  // If you want to, for example, refresh a list on all available consumers, you can you the broadcast method
  broadcastListenerService(user: unknown) {
    Messenger.broadcast("users.add-user-listener", user);
  }
}
```

> Now, this is how to receive and response to events :

In your payment service, just use the @Amqp decorarator

```typescript
// first, import your mesh service
import { Amqp } from "@vicgrk/messenger";

@Service()
export class MyService {
  constructor(private db: Database) {}

  @Amqp("member-informations")
  async getMemberInformation(memberId: string) {
    const member = await this.db.getUserFromId(memberId);
    return member;
  }
}
```

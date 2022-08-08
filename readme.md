# AMQP messenger

> Send message and response to event with ts decorators

## Before start

This library use a rabbitmq instance to communicate. You can spin up a **developpment message broker** with docker using:

```sh
docker run -d --rm --name my-rabbit -p 15672:15672 -p 5672:5672 rabbitmq:3-management
```

In a production environment, we recommand using a replicated RabbitMQ cluster.

## Installation

Warning, this package is not a DI manager and use other Dependency Injection manager to function properly. You can run this library with:

- [typedi](https://npmjs.com/packages/typedi)
- [TSED api environment](https://tsed.io/)

The author will try to add support for new depency injectors in the futures.

You can install the package with just

```sh
npm i --save amqp-messenger
```

## Documentation

You can start the amqp lib by initializing the Messenger singleton

### TypeDI

I recommand using it as a service :

```typescript
import { Service } from "typedi";
import { Messenger } from "amqp-messenger";

@Service()
export class Mesh {
  constructor() {
    Messenger.init({
      rootDir: __dirname,
      name: "my-node-name",
      rabbit: {
        host: process.env.RABBITMQ_HOST,
        port: process.env.RABBITMQ_PORT,
        user: process.env.RABBITMQ_USER,
        password: process.env.RABBITMQ_PASSWORD,
      },
      di: "typedi",
    });
  }
}
```

### TSED.io

For tsed, you can init your Messenger in your main configuration

```typescript
import { AfterInit } from "@tsed/common";
import { Configuration, Inject, InjectorService } from "@tsed/di";
import { Messenger } from "amqp-messenger";

@Module()
export class Server implements AfterInit {
  @Inject()
  private injector: InjectorService;

  $afterInit() {
    Messenger.init({
      rootDir: __dirname,
      name: "my-node-name",
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
import { Messenger } from "amqp-messenger";

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

  // If you just send data, without receiving anything, you can call the publish method. It's much smaller in compute requirements
  sendUserUpdate(user: unknown) {
    Messenger.publish("users.update-user", user);
  }
}
```

> Now, this is how to receive and response to events :

In your payment service, just use the @Amqp decorarator

```typescript
// first, import your mesh service
import { Amqp } from "amqp-messenger";

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

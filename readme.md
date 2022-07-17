# AMQP messenger

# THIS PACKAGE IS CURRENTLY UNDER DEVELOPMENT, IT HAS NOT BEEN PUBLISHED TO NPM REGISTRY

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

First of all, this librairy need to scan your project to register all decorators, it will only import the files to trigger the typescript
decorator process
To import files, use this method in a root file of your project (index.ts or other files that loads before your program start running)

```typescript
import { importer } from "amqp-messenger";
importer(`${__dirname}/events/**.*.ts`); // the path must group all files where you have @Amqp decorator
```

Now, you can start the amqp lib by instancing a NodeMesh object

I recommand using it as a service :

### TypeDI

```typescript
import { Service } from "typedi";
import { MeshNode } from "amqp-messenger";

@Service()
export class Mesh extends MeshNode {
  constructor() {
    super({
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

```typescript
import { Service } from "@tsed/di";
import { MeshNode } from "amqp-messenger";

@Service()
export class Mesh extends MeshNode {
  constructor() {
    super({
      name: "my-node-name",
      rabbit: {
        host: process.env.RABBITMQ_HOST,
        port: process.env.RABBITMQ_PORT,
        user: process.env.RABBITMQ_USER,
        password: process.env.RABBITMQ_PASSWORD,
      },
      di: "tsed",
    });
  }
}
```

### Configuration

> Library configuration object

| Name   | Default                | Description                                                                        |
| ------ | ---------------------- | ---------------------------------------------------------------------------------- |
| rabbit | see below the defaults | The rabbitmq credentials used to connect to the server                             |
| di     | undefined              | The di service usued in this package (can be typedi or tsed).                      |
| name   | undefined              | The service name of your application, usued to receive message from other services |

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
// first, import your mesh service
import { Mesh } from "../path/to/services/mesh";

@Service()
export class MyService {
  constructor(private mesh: Mesh) {}

  async getMemberInformation(memberId: string) {
    const member = await this.mesh.invoke<{ user: string }>(
      "payment.member-informations",
      {
        memberId,
      }
    );
    // you should receive an object from the payment service running in a different application.
  }

  // If you just send data, without receiving anything, you can call the publish method. It's much smaller in compute requirements
  sendUserUpdate(user: unknown) {
    this.mesh.publish("users.update-user", user);
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

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

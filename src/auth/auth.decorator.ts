/*
https://docs.nestjs.com/openapi/decorators#decorators
*/

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Auth = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (field) {
      if (request.auth[field]) {
        return request.auth[field]
      }
      return null;
    }
    return request.auth;
  },
);
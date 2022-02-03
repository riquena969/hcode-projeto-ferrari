/*
https://docs.nestjs.com/openapi/decorators#decorators
*/

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (field) {
      if (request.user[field]) {
        return request.user[field]
      }
      return null;
    }
    return request.user;
  },
);
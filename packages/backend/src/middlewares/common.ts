import { Router } from "express";

type Wrapper = (router: Router) => void | Promise<void>;

export const applyMiddleware = async (middleware: Wrapper[], router: Router): Promise<void> => {
    // eslint-disable-next-line no-restricted-syntax
    for (const func of middleware) {
      await func(router);
    }
  };
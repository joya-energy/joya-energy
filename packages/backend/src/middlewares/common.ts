import { Router } from "express";

type Wrapper = (router: Router) => void;

export const applyMiddleware = (middleware: Wrapper[], router: Router): void => {
    // eslint-disable-next-line no-restricted-syntax
    for (const func of middleware) {
      func(router);
    }
  };
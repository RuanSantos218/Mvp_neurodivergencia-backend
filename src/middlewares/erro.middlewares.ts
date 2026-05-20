import { Response, Request, NextFunction } from "express";

export const errorHandler = (err:  Error, req: Request, res: Response, next: NextFunction) => {
if (res.headersSent) {
    return next(err);
  }


    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
};


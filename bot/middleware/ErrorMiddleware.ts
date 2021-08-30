import { NextFunction, Request, Response } from "express"
import { HttpRequestError } from "../types/HttpErrorTypes"

export const ErrorMiddleware = (error: Error, _req: Request, res: Response, next: NextFunction): void => {
  if(error instanceof HttpRequestError) {
    res.status(error.code)
      .json({
        status: "error",
        message: error.message
      })
    console.debug("Request failed:", error)
  } else {
    res.status(500)
      .json({
        status: "error",
        message: error?.message ?? error
      })
    console.error("Request failed:", error)
  }
}

const errorHandler = (err, req, res, next) => {
  // Log error für Debugging
  console.error("Error:", err?.message);
  console.error("Stack:", err?.stack);

  // Verwende statusCode und message vom Error-Objekt falls vorhanden
  let statusCode = err?.statusCode || 500;
  let message = err?.message || "Serverfehler";

  // Mongoose Validation Error
  if (err?.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(statusCode).json({
      message: "Validierungsfehler",
      errors,
    });
  }

  // Mongoose Cast Error (ungültige ObjectId)
  if (err?.name === "CastError") {
    statusCode = 400;
    message = "Ungültige ID";
    return res.status(statusCode).json({
      message,
      error: err.message,
    });
  }

  // Mongoose Duplicate Key Error
  if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} existiert bereits`;
    return res.status(statusCode).json({
      message,
      field,
    });
  }

  // JWT Errors
  if (err?.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Ungültiges Token";
    return res.status(statusCode).json({
      message,
    });
  }

  if (err?.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token abgelaufen";
    return res.status(statusCode).json({
      message,
    });
  }

  // Default Error Response
  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err?.stack }),
  });
};

export default errorHandler;

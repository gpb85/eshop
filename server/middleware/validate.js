import Joi from "joi";

export const validate = (schema) => {
  return (req, res, next) => {
    // Συνδυάζουμε body, query και params σε ένα αντικείμενο
    const data = {
      ...req.body,
      ...req.query,
      ...req.params,
    };

    // Εκτελούμε Joi validation
    const { error } = schema.validate(data, { abortEarly: false });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({ success: false, errors: messages });
    }

    next();
  };
};

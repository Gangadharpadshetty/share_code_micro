const Joi = require('joi');
const logger = require('../logger/logger');

// Common validation schemas
const commonSchemas = {
  id: Joi.string().hex().length(24).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  url: Joi.string().uri().optional(),
  date: Joi.date().iso().optional(),
  boolean: Joi.boolean().optional(),
  number: Joi.number().optional(),
  string: Joi.string().optional(),
  array: Joi.array().optional(),
  object: Joi.object().optional()
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    role: Joi.string().valid('user', 'admin', 'mentor', 'employer').default('user'),
    phone: commonSchemas.phone,
    dateOfBirth: commonSchemas.date,
    gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').optional(),
    location: Joi.object({
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      country: Joi.string().optional(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional()
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password
  }),

  update: Joi.object({
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
    dateOfBirth: commonSchemas.date,
    gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').optional(),
    location: Joi.object({
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      country: Joi.string().optional(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional(),
    profile: Joi.object({
      bio: Joi.string().max(500).optional(),
      skills: Joi.array().items(Joi.string()).optional(),
      experience: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        company: Joi.string().required(),
        startDate: commonSchemas.date,
        endDate: commonSchemas.date.optional(),
        description: Joi.string().optional()
      })).optional(),
      education: Joi.array().items(Joi.object({
        degree: Joi.string().required(),
        institution: Joi.string().required(),
        graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional()
      })).optional()
    }).optional()
  })
};

// Job validation schemas
const jobSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(2000).required(),
    company: Joi.string().min(2).max(100).required(),
    location: Joi.string().required(),
    type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'freelance').required(),
    category: Joi.string().required(),
    salary: Joi.object({
      min: Joi.number().positive().optional(),
      max: Joi.number().positive().optional(),
      currency: Joi.string().default('USD').optional()
    }).optional(),
    requirements: Joi.array().items(Joi.string()).optional(),
    benefits: Joi.array().items(Joi.string()).optional(),
    isRemote: Joi.boolean().default(false),
    isUrgent: Joi.boolean().default(false),
    applicationDeadline: commonSchemas.date.optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    company: Joi.string().min(2).max(100).optional(),
    location: Joi.string().optional(),
    type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'freelance').optional(),
    category: Joi.string().optional(),
    salary: Joi.object({
      min: Joi.number().positive().optional(),
      max: Joi.number().positive().optional(),
      currency: Joi.string().default('USD').optional()
    }).optional(),
    requirements: Joi.array().items(Joi.string()).optional(),
    benefits: Joi.array().items(Joi.string()).optional(),
    isRemote: Joi.boolean().optional(),
    isUrgent: Joi.boolean().optional(),
    applicationDeadline: commonSchemas.date.optional(),
    tags: Joi.array().items(Joi.string()).optional()
  })
};

// Application validation schemas
const applicationSchemas = {
  create: Joi.object({
    jobId: commonSchemas.id,
    coverLetter: Joi.string().min(10).max(1000).optional(),
    resume: Joi.string().uri().optional(),
    experience: Joi.array().items(Joi.object({
      title: Joi.string().required(),
      company: Joi.string().required(),
      startDate: commonSchemas.date,
      endDate: commonSchemas.date.optional(),
      description: Joi.string().optional()
    })).optional(),
    education: Joi.array().items(Joi.object({
      degree: Joi.string().required(),
      institution: Joi.string().required(),
      graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional()
    })).optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    portfolio: Joi.string().uri().optional(),
    references: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      position: Joi.string().required(),
      company: Joi.string().required(),
      email: commonSchemas.email,
      phone: commonSchemas.phone.optional()
    })).optional()
  }),

  update: Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'shortlisted', 'interviewed', 'accepted', 'rejected', 'withdrawn').optional(),
    coverLetter: Joi.string().min(10).max(1000).optional(),
    resume: Joi.string().uri().optional(),
    experience: Joi.array().items(Joi.object({
      title: Joi.string().required(),
      company: Joi.string().required(),
      startDate: commonSchemas.date,
      endDate: commonSchemas.date.optional(),
      description: Joi.string().optional()
    })).optional(),
    education: Joi.array().items(Joi.object({
      degree: Joi.string().required(),
      institution: Joi.string().required(),
      graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional()
    })).optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    portfolio: Joi.string().uri().optional(),
    references: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      position: Joi.string().required(),
      company: Joi.string().required(),
      email: commonSchemas.email,
      phone: commonSchemas.phone.optional()
    })).optional()
  })
};

// Mentor validation schemas
const mentorSchemas = {
  create: Joi.object({
    userId: commonSchemas.id,
    bio: Joi.string().min(10).max(500).required(),
    expertise: Joi.array().items(Joi.string()).min(1).required(),
    skills: Joi.array().items(Joi.string()).optional(),
    experience: Joi.number().integer().min(0).required(),
    education: Joi.array().items(Joi.object({
      degree: Joi.string().required(),
      institution: Joi.string().required(),
      graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional()
    })).optional(),
    certifications: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      issuer: Joi.string().required(),
      issueDate: commonSchemas.date.optional(),
      expiryDate: commonSchemas.date.optional()
    })).optional(),
    achievements: Joi.array().items(Joi.string()).optional(),
    availability: Joi.object({
      days: Joi.array().items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')).optional(),
      timeSlots: Joi.array().items(Joi.object({
        startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
      })).optional(),
      timezone: Joi.string().default('UTC').optional()
    }).optional(),
    hourlyRate: Joi.number().positive().required(),
    currency: Joi.string().default('USD').optional()
  }),

  update: Joi.object({
    bio: Joi.string().min(10).max(500).optional(),
    expertise: Joi.array().items(Joi.string()).optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    experience: Joi.number().integer().min(0).optional(),
    education: Joi.array().items(Joi.object({
      degree: Joi.string().required(),
      institution: Joi.string().required(),
      graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional()
    })).optional(),
    certifications: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      issuer: Joi.string().required(),
      issueDate: commonSchemas.date.optional(),
      expiryDate: commonSchemas.date.optional()
    })).optional(),
    achievements: Joi.array().items(Joi.string()).optional(),
    availability: Joi.object({
      days: Joi.array().items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')).optional(),
      timeSlots: Joi.array().items(Joi.object({
        startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
      })).optional(),
      timezone: Joi.string().default('UTC').optional()
    }).optional(),
    hourlyRate: Joi.number().positive().optional(),
    currency: Joi.string().default('USD').optional()
  })
};

// Payment validation schemas
const paymentSchemas = {
  create: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().default('USD').required(),
    paymentMethod: Joi.string().valid('stripe', 'paypal', 'razorpay').required(),
    description: Joi.string().optional(),
    metadata: Joi.object({
      sessionType: Joi.string().optional(),
      sessionId: commonSchemas.id.optional(),
      mentorId: commonSchemas.id.optional(),
      menteeId: commonSchemas.id.optional()
    }).optional(),
    billing: Joi.object({
      name: Joi.string().required(),
      email: commonSchemas.email.required(),
      address: Joi.object({
        line1: Joi.string().required(),
        line2: Joi.string().optional(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required()
      }).optional()
    }).optional()
  })
};

// Recommendation validation schemas
const recommendationSchemas = {
  userProfile: Joi.object({
    userId: commonSchemas.id,
    basicInfo: Joi.object({
      age: Joi.number().integer().min(18).max(100).optional(),
      gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').optional(),
      location: Joi.object({
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        coordinates: Joi.object({
          lat: Joi.number().min(-90).max(90).optional(),
          lng: Joi.number().min(-180).max(180).optional()
        }).optional()
      }).optional()
    }).optional(),
    personality: Joi.object({
      traits: Joi.array().items(Joi.string()).optional(),
      interests: Joi.array().items(Joi.string()).optional(),
      values: Joi.array().items(Joi.string()).optional()
    }).optional(),
    preferences: Joi.object({
      ageRange: Joi.object({
        min: Joi.number().integer().min(18).max(100).optional(),
        max: Joi.number().integer().min(18).max(100).optional()
      }).optional(),
      location: Joi.object({
        maxDistance: Joi.number().positive().optional(),
        preferredCities: Joi.array().items(Joi.string()).optional()
      }).optional(),
      dealBreakers: Joi.array().items(Joi.string()).optional()
    }).optional(),
    behavior: Joi.object({
      swipes: Joi.array().items(Joi.object({
        targetUserId: commonSchemas.id,
        action: Joi.string().valid('like', 'dislike', 'superlike').required(),
        timestamp: commonSchemas.date
      })).optional(),
      matches: Joi.array().items(Joi.object({
        targetUserId: commonSchemas.id,
        timestamp: commonSchemas.date
      })).optional(),
      messages: Joi.array().items(Joi.object({
        targetUserId: commonSchemas.id,
        messageType: Joi.string().valid('text', 'image', 'voice').required(),
        timestamp: commonSchemas.date
      })).optional()
    }).optional()
  }),

  interaction: Joi.object({
    userId: commonSchemas.id,
    targetUserId: commonSchemas.id,
    interactionType: Joi.string().valid('view', 'like', 'dislike', 'superlike', 'match', 'message', 'unmatch').required(),
    metadata: Joi.object({
      duration: Joi.number().positive().optional(),
      messageType: Joi.string().valid('text', 'image', 'voice').optional(),
      location: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional(),
    timestamp: commonSchemas.date.default(() => new Date())
  })
};

// Query validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  search: Joi.object({
    q: Joi.string().min(1).optional(),
    category: Joi.string().optional(),
    location: Joi.string().optional(),
    type: Joi.string().optional(),
    isRemote: Joi.boolean().optional(),
    minSalary: Joi.number().positive().optional(),
    maxSalary: Joi.number().positive().optional(),
    dateRange: Joi.object({
      start: commonSchemas.date.optional(),
      end: commonSchemas.date.optional()
    }).optional()
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      logger.warn('Validation error:', { error: error.details, body: req.body });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedBody = value;
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      logger.warn('Query validation error:', { error: error.details, query: req.query });
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedQuery = value;
    next();
  };
};

// Params validation middleware
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);
    
    if (error) {
      logger.warn('Params validation error:', { error: error.details, params: req.params });
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedParams = value;
    next();
  };
};

module.exports = {
  commonSchemas,
  userSchemas,
  jobSchemas,
  applicationSchemas,
  mentorSchemas,
  paymentSchemas,
  recommendationSchemas,
  querySchemas,
  validate,
  validateQuery,
  validateParams
};

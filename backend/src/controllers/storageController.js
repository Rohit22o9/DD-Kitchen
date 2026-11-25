const StorageBooking = require('../models/StorageBooking');
const storageService = require('../services/storageService');
const { asyncHandler } = require('../utils/httpError');

const availability = asyncHandler(async (req, res) => res.json(await storageService.availability(req.validatedQuery)));

const create = asyncHandler(async (req, res) => {
  const s = await storageService.createStorageBooking(req.user, req.body);
  res.status(201).json(s.toPublicShape());
});

const listAll = asyncHandler(async (req, res) => {
  const list = await StorageBooking.find().select('+access_code').sort({ start_date: -1 }).limit(500);
  res.json(list.map((s) => s.toPublicShape({ admin: true, includeAccessCode: true })));
});

const updateStatus = asyncHandler(async (req, res) => {
  const s = await storageService.adminUpdateStorage(req.user, req.params.refCode, req.body);
  res.json(s.toPublicShape({ admin: true, includeAccessCode: true }));
});

module.exports = { availability, create, listAll, updateStatus };

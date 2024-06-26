const asyncHandler = require('express-async-handler')
const Order = require('../models/orderModel')
const Product = require('../models/productModel')

exports.newOrder = asyncHandler(async (req, res) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body
  if (
    !shippingInfo.address ||
    !shippingInfo.city ||
    !shippingInfo.state ||
    !shippingInfo.pinCode ||
    !shippingInfo.phone
  ) {
    return res
      .status(400)
      .send({ message: 'Please enter all shipping details' })
  }
  if (
    !shippingInfo ||
    !orderItems ||
    !paymentInfo ||
    !itemPrice ||
    !taxPrice ||
    !shippingPrice ||
    !totalPrice
  ) {
    return res.status(400).send({ message: 'Please enter all details' })
  }
  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  })
  res.status(200).send(order)
})

exports.myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
  if (!orders) {
    return res.status(404).send({ message: 'No orders found' })
  }
  res.status(200).send(orders)
})

exports.singleOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user', // this method is used to populate the user field of the Order with name and email field of the User to which it is referencing
    `firstName lastName email`
  )
  if (!order) {
    return res.status(404).send({ message: 'No order found' })
  }
  res.status(200).send(order)
})

exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate(
    'user',
    'firstName lastName email phone'
  )
  if (!orders) {
    return res.status(404).send({ message: 'No orders yet' })
  }
  let totalAmount = 0
  orders.forEach((order) => {
    totalAmount += order.totalPrice
  })
  res.status(200).send(orders)
})

exports.updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    return res.status(404).send({ message: 'No order found' })
  }
  if (!req.body.status) {
    return res.status(400).send({ message: 'Please enter status' })
  }
  if (order.orderStatus === 'Delivered') {
    return res.status(400).send({ message: 'Order delivered already' })
  }
  order.orderItems.forEach(async (order) => {
    await updateStock(order.productId, order.quantity)
  })
  order.orderStatus = req.body.status
  if (req.body.status === 'Delivered') {
    order.deliveredAt = Date.now()
  }
  await order.save({ validateBeforeSave: false })
  res.status(200).send({ message: 'Order updated successfully' })
})

async function updateStock(id, quantity) {
  const product = await Product.findById(id)
  product.quantity -= quantity
  await product.save({ validateBeforeSave: false })
}

exports.deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    return res.status(404).send({ message: 'No order found' })
  }
  await order.deleteOne()
  res.status(200).send({ message: 'Order deleted successfully' })
})

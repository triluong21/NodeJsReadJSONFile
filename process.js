"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
// @ts-nocheck
var fs = require('fs');
var _ = require('lodash');
// const file = fs.readFileSync("./payload.json");
// const order = JSON.parse(file.toString('utf8'));
exports.processIt = function (order) {
    var originalCustomer = order.customer;
    var payment = order.payment;
    var createWsgOrder = function (customer, payment, orderArray) {
        var collectedItems = orderArray.map(function (item) { return item.orderItem; });
        var prunedItems = collectedItems.map(function (item) {
            return _.omit(item, ['promotionKey', 'prodId']);
        });
        var wsgOrder = {
            prodIdAlias: orderArray[0].orderItem.prodId,
            order: {
                promotionKey: orderArray[0].orderItem.promotionKey,
                customer: __assign({}, customer),
                payment: __assign({}, payment),
                orderItems: prunedItems
            }
        };
        return wsgOrder;
    };
    var buildOrders = function (orders) {
        var builtOrders = [];
        Object.keys(orders).map(function (prodId) {
            var orderArray = orders[prodId];
            Object.keys(orderArray).forEach(function (promkey) {
                builtOrders.push(createWsgOrder(originalCustomer, payment, orderArray[promkey]));
            });
        });
        return builtOrders;
    };
    /* Group orders into buckets by [order unit][prodId][promkey]
       allOrderMap can be roughly typed as:
       Array<Map<String, Map<String, Array<Order>>>>
       where the first string is prodId and the second string is promkey/offercode
    */
    var allOrderMap = [];
    order.orderUnits.forEach(function (orderUnit, index) {
        var servMap = {}, pfMap = {}, ehubMap = {};
        var servOrders = orderUnit.orderItems.filter(function (orderItem) {
            return orderItem.prodId === "GFT";
        }).map(function (orderItem) {
            return __assign({}, orderUnit.orderInfo, { orderItem: orderItem });
        });
        var pfOrders = orderUnit.orderItems.filter(function (orderItem) {
            return orderItem.prodId === "AMSCKI";
        }).map(function (orderItem) {
            return __assign({}, orderUnit.orderInfo, { orderItem: orderItem });
        });
        var ehubOrders = orderUnit.orderItems.filter(function (orderItem) {
            return orderItem.prodId === "007";
        }).map(function (orderItem) {
            return __assign({}, orderUnit.orderInfo, { orderItem: orderItem });
        });
        servOrders.forEach(function (servOrder) {
            var prodId = servOrder.orderItem.prodId;
            var promkey = servOrder.orderItem.promotionKey;
            if (!servMap[prodId]) {
                servMap[prodId] = {};
            }
            if (!servMap[prodId][promkey]) {
                servMap[prodId][promkey] = [servOrder];
            }
            else {
                servMap[prodId][promkey].push(servOrder);
            }
        });
        pfOrders.forEach(function (pfOrder) {
            var prodId = pfOrder.orderItem.prodId;
            var promkey = pfOrder.orderItem.promotionKey;
            if (!pfMap[prodId]) {
                pfMap[prodId] = {};
            }
            if (!pfMap[prodId][promkey]) {
                pfMap[prodId][promkey] = [pfOrder];
            }
            else {
                pfMap[prodId][promkey].push(pfOrder);
            }
        });
        ehubOrders.forEach(function (ehubOrder) {
            var prodId = ehubOrder.orderItem.prodId;
            var promkey = ehubOrder.orderItem.offerCode;
            if (!ehubMap[prodId]) {
                ehubMap[prodId] = {};
            }
            if (!ehubMap[prodId][promkey]) {
                ehubMap[prodId][promkey] = [ehubOrder];
            }
            else {
                ehubMap[prodId][promkey].push(ehubOrder);
            }
        });
        allOrderMap[index] = {};
        allOrderMap[index]["SERV"] = servMap;
        allOrderMap[index]["PF"] = pfMap;
        allOrderMap[index]["EHUB"] = ehubMap;
    });
    var wsgOrders = [];
    // Iterate over each bucket, creating one WSG order for each
    allOrderMap.forEach(function (customer) {
        wsgOrders = wsgOrders.concat(buildOrders(customer["SERV"]));
        wsgOrders = wsgOrders.concat(buildOrders(customer["PF"]));
        wsgOrders = wsgOrders.concat(buildOrders(customer["EHUB"]));
    });
    wsgOrders.forEach(function (wsgOrder) {
        console.log(JSON.stringify(wsgOrder, null, '  '));
    });
    console.log("Created " + wsgOrders.length + " WSG orders.");
    return wsgOrders.length;
};

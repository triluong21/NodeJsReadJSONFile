// @ts-nocheck
const fs = require('fs');
const _ = require('lodash');

// const file = fs.readFileSync("./payload.json");
// const order = JSON.parse(file.toString('utf8'));
export const processIt = (order) => {
    const originalCustomer = order.customer;
    const payment = order.payment;

    // _.omit() below is from lodash extention
    const createWsgOrder = (customer, payment, orderArray) => {
        const collectedItems = orderArray.map(item => { return item.orderItem });
        const prunedItems = collectedItems.map(item => {
            return _.omit(item, ['promotionKey', 'prodId']);
        })
        const wsgOrder = {
            prodIdAlias: orderArray[0].orderItem.prodId,
            order: {
                promotionKey: orderArray[0].orderItem.promotionKey,
                customer: { ...customer },
                payment: { ...payment },
                orderItems: prunedItems
            }
        };
        return wsgOrder;
    };

    const buildOrders = (orders) => {
        const builtOrders = [];
        Object.keys(orders).map(prodId => {
            const orderArray = orders[prodId];
            Object.keys(orderArray).forEach(promkey => {
                builtOrders.push(createWsgOrder(originalCustomer, payment, orderArray[promkey]));
            });
        });
        return builtOrders;
    }
    /* Group orders into buckets by [order unit][prodId][promkey]
       allOrderMap can be roughly typed as:
       Array<Map<String, Map<String, Array<Order>>>>
       where the first string is prodId and the second string is promkey/offercode 
    */
    const allOrderMap = [];

    order.orderUnits.forEach((orderUnit, index) => {
        const servMap = {}, pfMap = {}, ehubMap = {};
        const servOrdersx = orderUnit.orderItems.filter(orderItem => {
            return orderItem.prodId === "GFT";
        });
        const servOrders = servOrdersx.map(orderItem => {
            return { ...orderUnit.orderInfo, orderItem: orderItem };
        });        
/*
* const statement below is equivalent with the combination of TWO conts statements
* above.
*/        
        // const servOrders = orderUnit.orderItems.filter(orderItem => {
        //     return orderItem.prodId === "GFT";
        // }).map(orderItem => {
        //     return { ...orderUnit.orderInfo, orderItem: orderItem };
        // });
        const pfOrders = orderUnit.orderItems.filter(orderItem => {
            return orderItem.prodId === "AMSCKI";
        }).map(orderItem => {
            return { ...orderUnit.orderInfo, orderItem: orderItem };
        });
        const ehubOrders = orderUnit.orderItems.filter(orderItem => {
            return orderItem.prodId === "007";
        }).map(orderItem => {
            return { ...orderUnit.orderInfo, orderItem: orderItem };
        });

        servOrders.forEach(servOrder => {
            const prodId = servOrder.orderItem.prodId;
            const promkey = servOrder.orderItem.promotionKey;

            if (!servMap[prodId]) {
                servMap[prodId] = {};
            }

            if (!servMap[prodId][promkey]) {
                servMap[prodId][promkey] = [];
                servMap[prodId][promkey].push(servOrder);
    
                // servMap[prodId][promkey] = [servOrder]
            } else {
                servMap[prodId][promkey].push(servOrder);
            }
/* 
* The below commented if statement below is actually work the same
* as the if statement right above.
*/            
            // if (!servMap[prodId][promkey]) {
            //     servMap[prodId][promkey] = [servOrder]
            // } else {
            //     servMap[prodId][promkey].push(servOrder);
            // }
        });

        pfOrders.forEach(pfOrder => {
            const prodId = pfOrder.orderItem.prodId;
            const promkey = pfOrder.orderItem.promotionKey;

            if (!pfMap[prodId]) {
                pfMap[prodId] = {};
            }

            if (!pfMap[prodId][promkey]) {
                pfMap[prodId][promkey] = [pfOrder]
            } else {
                pfMap[prodId][promkey].push(pfOrder);
            }
        });

        ehubOrders.forEach(ehubOrder => {
            const prodId = ehubOrder.orderItem.prodId;
            const promkey = ehubOrder.orderItem.offerCode;

            if (!ehubMap[prodId]) {
                ehubMap[prodId] = {};
            }

            if (!ehubMap[prodId][promkey]) {
                ehubMap[prodId][promkey] = [ehubOrder]
            } else {
                ehubMap[prodId][promkey].push(ehubOrder);
            }
        });
        allOrderMap[index] = {};
        allOrderMap[index]["SERV"] = servMap;
        allOrderMap[index]["PF"] = pfMap;
        allOrderMap[index]["EHUB"] = ehubMap;
    });

    let wsgOrders = [];

    // Iterate over each bucket, creating one WSG order for each
    allOrderMap.forEach(customer => {
        wsgOrders = wsgOrders.concat(buildOrders(customer["SERV"]));
        wsgOrders = wsgOrders.concat(buildOrders(customer["PF"]));
        wsgOrders = wsgOrders.concat(buildOrders(customer["EHUB"]));
    });

    wsgOrders.forEach(wsgOrder => {
        console.log(JSON.stringify(wsgOrder, null, '  '));
    });
    console.log(`Created ${wsgOrders.length} WSG orders.`);
    return wsgOrders.length;
}

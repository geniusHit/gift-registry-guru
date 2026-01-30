import fs from "fs";
import { sqlTables } from "../constants/sqlTable.js";
import { emailQuotaLimitHTML, uninstallationEmailHTML } from "../utils/sendEmail.js";
import database from "../connection/database.js";
import logger from "../../loggerFile.js";
import { inactiveStatusToBrevo } from "../brevo/brevoFxn.js";
import { Constants } from "../constants/constant.js";
import shopify from "../../shopify.js";
import { backInStock, lowInStock, priceDrop, sendEmail } from "../utils/sendEmail.js";
import createAppDataMetafields from "../utils/appDataMetafields.js";
import axios from "axios";
import { KlaviyoCreateEventEmailRemainder } from "../controllers/controllersSql.js";


const { app_installation_table, app_installation_log_table, user_table, Wishlist_table, product_table, store_email_temp_table, email_reminder_table, store_languages_table, store_languages_url_table, klaviyo_table } = sqlTables;

const { supportEmail, backInStockKlaviyo, priceDropKlaviyo, lowInStockKlaviyo } = Constants;

export async function appDeletion(payload, shop) {
    database.query(
        `SELECT * FROM  ${app_installation_table} WHERE shop_name = '${payload.myshopify_domain}'`,
        (err, result) => {
            if (err) {
                console.log(err);
                logger.error(err);
            } else {
                if (result.length > 0) {
                    let storeName = payload.name.replace(/'/g, "~");
                    database.query(
                        `UPDATE ${app_installation_table} SET status='inActive',active_plan_id='0',active_plan_name='null', access_token = ${null}, store_name='${storeName}' WHERE shop_name = '${payload.myshopify_domain}'`,
                        (err, results) => {
                            if (err) {
                                console.log(err);
                                logger.error(err);
                            } else {
                                database.query(
                                    `SELECT plan_type FROM ${app_installation_log_table} WHERE app_install_id = '${result[0].app_install_id}' ORDER BY log_date DESC LIMIT 1`,
                                    (err, plan) => {
                                        if (err) {
                                            console.log(err);
                                            logger.error(err);
                                        } else {
                                            database.query(
                                                `INSERT INTO ${app_installation_log_table} (app_install_id,plan_id,plan_name, plan_type) VALUES (${result[0].app_install_id},'0','null', '${plan[0].plan_type}')`,
                                                (err, resultss) => {
                                                    if (err) {
                                                        console.log(err);
                                                        logger.error(err);
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        }
    );
    const shop_email = payload.customer_email;
    const shop_owner = payload.shop_owner;

    let mailHtml = uninstallationEmailHTML(shop_owner);
    let emailContent = {
        from: supportEmail,
        to: shop_email,
        subject: "Thanks for using Wishlist Guru App",
        html: mailHtml,
    };
    sendEmail(emailContent);

    if (payload.email === payload.customer_email) {
        await inactiveStatusToBrevo(payload.email);
    } else {
        await inactiveStatusToBrevo(payload.email);
        await inactiveStatusToBrevo(payload.customer_email);
    }

    // deleteUserDataAtUninstallation(payload?.myshopify_domain);
}

export async function variantsInStock(payload, shop) {
    // console.log("payload  --------- ", payload)
    if (shop) {
        // console.log("Webhook BACK IN STOCK -- ", shop);
        try {
            const shopName = shop;
            const result = await new Promise((resolve, reject) => {
                database.query(
                    `SELECT ai.active_plan_id as activePlanId, ai.shop_email, ai.store_name, er.logo, er.app_install_id, er.back_in_stock as backInStockCheck FROM app_installation as ai, email_reminder as er WHERE ai.app_install_id = er.app_install_id AND ai.shop_name='${shopName}'`,
                    (err, result) => {
                        if (err) {
                            webhookErr(err);
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    }
                );
            });

            const lowInStockCheckValue = result[0]?.backInStockCheck || "no";
            const logo = result[0]?.logo;
            const app_install_id = result[0]?.app_install_id;
            const activePlanId = Number(result[0]?.activePlanId) || 1;
            const replyTO = result[0]?.shop_email || "";
            const emailQuota = await returnEmailQuota(shopName);
            const storeName = result[0]?.store_name || "";

            if (activePlanId >= 3 && lowInStockCheckValue === "yes") {
                const results = await databaseQuery(`
          SELECT DISTINCT u.email , w.price , u.store_name as storeName,  w.variant_id, w.image, w.handle as productHandle, w.title 
          FROM ${user_table} as u, ${Wishlist_table} as wt, ${product_table} as w 
          WHERE u.shop_name="${shopName}" 
          AND u.id = wt.wishlist_user_id 
          AND wt.wishlist_id=w.wishlist_id 
          AND user_type="User" 
          AND w.variant_id = '${payload.id}' 
          AND u.email_valid = 1 ;`);

                if (results.length === 0) {
                    console.log("No product available of this variant");
                    return; // Exit the function early
                }

                const resolvedCustomerData = await Promise.all(
                    results.map(async (row) => {
                        return {
                            email: row.email,
                            name: "Customer",
                        };
                    })
                );

                const checkKlaviyoRecordExist = await checkKlaviyoRecord(shopName);
                if (activePlanId >= 4 && checkKlaviyoRecordExist && checkKlaviyoRecordExist.length > 0) {
                    const checkKlaviyoApiKeyResult = await checkKlaviyoApiKey(checkKlaviyoRecordExist[0].private_key);
                    if (checkKlaviyoApiKeyResult.type === "success") {
                        const userItems = { variant_id: payload.id, title: results[0].title, shopName: shopName, storeName: results[0].storeName, productImage: results[0].image, handle: results[0].productHandle, product_id: results[0].product_id }
                        resolvedCustomerData.forEach(async (customer) => {
                            await KlaviyoIntegrationEmailRemainderFxn(userItems, checkKlaviyoRecordExist, customer.email, backInStockKlaviyo, shopName);
                        })
                    }
                    else {
                        if (activePlanId >= 3
                            // && emailQuota[0]?.emails_sent < emailQuota[0]?.email_quota
                        ) {
                            const emailData = await new Promise((resolve, reject) => {
                                database.query(
                                    `SELECT back_in_stock_temp FROM  ${store_email_temp_table} AS se JOIN ${email_reminder_table} AS er ON er.id = se.id AND er.shop_name = '${shopName}'`,
                                    (err, result) => {
                                        if (err) {
                                            webhookErr(err);
                                            reject(err);
                                        } else {
                                            resolve(result);
                                        }
                                    }
                                );
                            });
                            backInStock(
                                resolvedCustomerData,
                                // `${results[0]?.title} (${payload.title})`,
                                `${results[0]?.title}${payload.title !== "Default Title" ? ` (${payload.title})` : ""}`,
                                // payload.title,
                                payload.id,
                                results[0].productHandle,
                                shopName,
                                shop,
                                supportEmail,
                                results[0].image,
                                logo,
                                app_install_id,
                                JSON.parse(emailData[0].back_in_stock_temp),
                                databaseQuery,
                                emailQuota
                            );
                        }
                    }
                }
                else {
                    if (activePlanId >= 3
                        // && emailQuota[0]?.emails_sent < emailQuota[0]?.email_quota
                    ) {
                        const emailData = await new Promise((resolve, reject) => {
                            database.query(
                                `SELECT se.back_in_stock_temp, se.sender_name, se.reply_to FROM  ${store_email_temp_table} AS se JOIN ${email_reminder_table} AS er ON er.id = se.id AND er.shop_name = '${shopName}'`,
                                (err, result) => {
                                    if (err) {
                                        webhookErr(err);
                                        reject(err);
                                    } else {
                                        resolve(result);
                                    }
                                }
                            );
                        });


                        if (!results[0]?.productHandle) {
                            console.error("Error in -- productHandle is ", results[0]?.productHandle);
                            return; // Exit the function early
                        }

                        // console.log("emailData ----- ", emailData)
                        backInStock(
                            resolvedCustomerData,
                            // `${results[0]?.title} (${payload.title})`,
                            `${results[0]?.title}${payload.title !== "Default Title" ? ` (${payload.title})` : ""}`,
                            // payload.title,
                            payload.id,
                            results[0].productHandle,
                            shopName,
                            shop,
                            supportEmail,
                            results[0].image,
                            logo,
                            app_install_id,
                            JSON.parse(emailData[0].back_in_stock_temp),
                            databaseQuery,
                            emailQuota,
                            emailData[0].sender_name,
                            storeName,
                            emailData[0].reply_to ? emailData[0].reply_to : replyTO
                        );
                    }
                }
            }
        } catch (error) {
            webhookErr(error);
            console.error("Error occurred:", error);
        }
    }
}

export async function inventoryUpdate(payload, shop, inventoryUpdate) {
    // console.log("payload ------  ", payload)
    if (shop) {
        // console.log("Webhook LOW IN STOCK -- ", shop);
        try {
            const shopName = shop;
            const result = await databaseQuery(
                `SELECT ai.active_plan_id as activePlanId, ai.shop_email, ai.store_name, er.logo, er.app_install_id, er.low_in_stock as lowInStockCheck FROM app_installation as ai, email_reminder as er WHERE  ai.app_install_id = er.app_install_id AND ai.shop_name='${shopName}'`
            );

            if (result.length > 0) {
                const activePlanId = Number(result[0]?.activePlanId) || 1;
                const lowInStockCheck = result[0]?.lowInStockCheck || "no";
                const logo = result[0]?.logo;
                const app_install_id = result[0]?.app_install_id;
                const replyTO = result[0]?.shop_email;
                const emailQuota = await returnEmailQuota(shopName);
                const storeName = result[0]?.store_name;

                if (activePlanId >= 3 && lowInStockCheck === "yes") {
                    const productData = payload.variants;
                    const foundItem = productData.find((del) => Number(inventoryUpdate.inventory_item_id) === Number(del.inventory_item_id));

                    if (Number(inventoryUpdate.available) < 5 && Number(inventoryUpdate.available) > 0) {
                        const results = await databaseQuery(`SELECT  DISTINCT u.email , w.price ,w.title, w.product_id, u.store_name as storeName, w.variant_id FROM ${user_table} as u, ${Wishlist_table} as wt, ${product_table} as w WHERE u.shop_name="${shopName}" AND u.id = wt.wishlist_user_id AND wt.wishlist_id=w.wishlist_id AND user_type="User" AND w.variant_id = '${foundItem?.id}' AND u.email_valid = 1 ;`);

                        if (results.length === 0) {
                            console.log("No product available of this variant");
                            return; // Exit the function early
                        }

                        const resolvedCustomerData = await Promise.all(
                            results.map(async (row) => {
                                return {
                                    email: row.email,
                                    name: "Customer",
                                };
                            })
                        );
                        const checkKlaviyoRecordExist = await checkKlaviyoRecord(shopName);
                        const checkKlaviyoApiKeyResult = await checkKlaviyoApiKey(checkKlaviyoRecordExist[0]?.private_key);
                        if (activePlanId >= 4 && checkKlaviyoRecordExist && checkKlaviyoRecordExist.length > 0 && checkKlaviyoApiKeyResult.type === "success") {

                            const userItems = { variant_id: payload.id, title: results[0].title, shopName: shopName, storeName: results[0].storeName, productImage: payload.image.src, handle: payload.handle, product_id: results[0].product_id }
                            resolvedCustomerData.forEach(async (customer) => {
                                await KlaviyoIntegrationEmailRemainderFxn(userItems, checkKlaviyoRecordExist, customer.email, lowInStockKlaviyo, shopName);
                            })
                        } else {
                            if (activePlanId >= 3 && lowInStockCheck === "yes"
                                // && emailQuota[0]?.emails_sent < emailQuota[0]?.email_quota
                            ) {

                                const emailData = await new Promise((resolve, reject) => {
                                    database.query(`SELECT se.low_in_stock_temp, se.sender_name, se.reply_to FROM  ${store_email_temp_table} AS se JOIN ${email_reminder_table} AS er ON er.id = se.id AND er.shop_name = '${shopName}'`, (err, result) => {
                                        if (err) {
                                            webhookErr(err);
                                            reject(err);
                                        } else {
                                            resolve(result);
                                        }
                                    }
                                    );
                                });

                                if (!foundItem.id) {
                                    console.error("Error in -- foundItem.id is ", foundItem.id);
                                    return; // Exit the function early
                                }

                                lowInStock(
                                    resolvedCustomerData,
                                    payload.title,
                                    foundItem.id,
                                    payload.handle,
                                    shopName,
                                    shop,
                                    supportEmail,
                                    payload.image.src,
                                    logo,
                                    app_install_id,
                                    JSON.parse(emailData[0].low_in_stock_temp),
                                    databaseQuery,
                                    emailQuota,
                                    emailData[0].sender_name,
                                    storeName,
                                    emailData[0].reply_to ? emailData[0].reply_to : replyTO
                                );
                            }
                            // else{
                            //     await handleEmailQuotaExceeded(emailQuota, shopName);
                            // }
                        }
                    }
                }
            }
        } catch (error) {
            webhookErr(error);
            console.error("Error occurred:", error);
        }
    }
}

export async function productUpdate(payload, shop) {
    // console.log("11111 --- ", payload)
    // console.log("22222 --- ", shop)
    if (!shop) return;
    // console.log("Webhook PRICE DROP --", shop);
    let emailQuotaExceeded = false;
    try {
        const shopName = shop;
        const result = await queryDatabase(`
      SELECT ai.active_plan_id as activePlanId, ai.shop_email, ai.store_name, er.logo, er.app_install_id, er.price_drop as priceDropCheck
      FROM app_installation as ai, email_reminder as er
      WHERE ai.app_install_id = er.app_install_id AND ai.shop_name = ?`, [shopName]);

        const { priceDropCheck = "no", logo, app_install_id, shop_email, activePlanId = 1, store_name } = result[0] || {};
        const emailQuota = await returnEmailQuota(shopName);

        const checkKlaviyoRecordExist = await checkKlaviyoRecord(shopName);
        const checkKlaviyoApiKeyResult = await checkKlaviyoApiKey(checkKlaviyoRecordExist[0]?.private_key);

        // Determine if price drop is valid and if email can be sent via Klaviyo
        const isPriceDropValid = (activePlanId >= 4 && priceDropCheck === "yes" && checkKlaviyoRecordExist && checkKlaviyoRecordExist.length > 0 && checkKlaviyoApiKeyResult.type === "success");

        const rowsToSend = [];

        const updatePriceAndSendEmail = async (del, row) => {
            if (Number(del.price) < Number(row.price)) {
                rowsToSend.push(row);
                const dropPercentage = calculateDropPercentage(row.price, del.price);
                const finalPercentage = `${dropPercentage.toFixed(2)}%`;

                await updateProductPrice(row.id, del.price);
                const userItems = {
                    variant_id: payload.id,
                    title: row.title,
                    shopName,
                    storeName: row.storeName,
                    productImage: payload.image.src,
                    handle: payload.handle,
                    product_id: row.product_id,
                    price: del.price,
                };
                // Conditional email sending
                if (isPriceDropValid) {
                    // Send Klaviyo email for price drop
                    await KlaviyoIntegrationEmailRemainderFxn(userItems, checkKlaviyoRecordExist, row.email, priceDropKlaviyo, shopName);
                } else {
                    const emailData = await queryDatabase(`
            SELECT se.price_drop_temp, se.sender_name, se.reply_to FROM ${store_email_temp_table} AS se
            JOIN ${email_reminder_table} AS er ON er.id = se.id AND er.shop_name = ?
            `, [shopName]);

                    const resolvedCustomerData = [{ email: row.email, name: "Customer" }];
                    await priceDrop(
                        resolvedCustomerData,
                        payload.title,
                        row.variant_id,
                        row.price,
                        del.price,
                        finalPercentage,
                        payload.handle,
                        shopName,
                        shop,
                        supportEmail,
                        payload.image.src,
                        logo,
                        app_install_id,
                        JSON.parse(emailData[0]?.price_drop_temp),
                        databaseQuery,
                        emailData[0]?.sender_name,
                        store_name,
                        emailData[0]?.reply_to ? emailData[0]?.reply_to : shop_email,
                    );
                }
            } else if (Number(del.price) > Number(row.price)) {
                await updateProductPrice(row.id, del.price);
            }
        };

        // Process price drop if valid
        if (isPriceDropValid || (activePlanId >= 3 && priceDropCheck === "yes")) {
            for (const del of payload.variants) {

                try {
                    const result = await queryDatabase(`
                    SELECT u.email, u.store_name as storeName, w.price, w.variant_id, w.id, w.product_id, w.title, w.handle as productHandle
                    FROM ${user_table} as u, ${Wishlist_table} as wt, ${product_table} as w
                    WHERE u.shop_name = ? AND u.id = wt.wishlist_user_id AND wt.wishlist_id = w.wishlist_id
                    AND user_type = "User" AND u.email_valid = 1 AND w.variant_id = ?`, [shopName, del.id]);

                    if (result.length === 0) {
                        console.log("No product available of this variant");
                        return; // Exit the function early
                    }

                    for (const [index, row] of result.entries()) {
                        if (isPriceDropValid) {
                            await updatePriceAndSendEmail(del, row);
                        } else {

                            const emailsSentSoFar = emailQuota[0]?.emails_sent + index + 1;
                            const limit = emailQuota[0]?.email_quota;
                            // Check if within quota
                            const isEmailQuotaValid = (activePlanId >= 3 && priceDropCheck === "yes" && emailsSentSoFar <= limit);

                            if (isEmailQuotaValid) {
                                await updatePriceAndSendEmail(del, row);
                            } else {
                                const exceededBy = emailsSentSoFar - limit;
                                if (exceededBy <= 5) {
                                    if (!emailQuotaExceeded) { // Call only once
                                        await handleEmailQuotaExceeded(emailQuota, shopName);
                                        const insertData = await databaseQuery(
                                            `INSERT INTO email_reports (shop_name, email_type, subject, user_email) VALUES ('${shopName}', 'Limit cross', 'Wishlist GURU - Monthly email limit reached', '${emailQuota[0]?.shop_email}')`
                                        );
                                        emailQuotaExceeded = true;
                                    }
                                } else {
                                    console.log(`Email quota exceeded by ${exceededBy}, within buffer limit. Skipping handler.`);
                                    return;
                                }
                                break;
                            }

                            // const emailsSentSoFar = emailQuota[0]?.emails_sent + index + 1;
                            // const isEmailQuotaValid = (activePlanId >= 3 && priceDropCheck === "yes" && emailsSentSoFar <= emailQuota[0]?.email_quota);

                            // console.log("emailsSentSoFar -- ", emailsSentSoFar)
                            // console.log("emailQuota[0]?.email_quota -- ", emailQuota[0]?.email_quota)

                            // if (isEmailQuotaValid) {
                            //     console.log("Sending Mail --- ")
                            //     await updatePriceAndSendEmail(del, row);
                            // }
                            // else {
                            //     console.log("Limit cross --- ")

                            //     console.log("emailQuotaExceeded -- ", emailQuotaExceeded)

                            //     if (!emailQuotaExceeded) {  // Only call handleEmailQuotaExceeded once
                            //         console.log('Email quota exceeded. Cannot send more emails.');
                            //         await handleEmailQuotaExceeded(emailQuota, shopName);

                            //         const insertData = await databaseQuery(
                            //             `INSERT INTO email_reports (shop_name, email_type, subject, user_email) VALUES ('${shopName}', 'Limit cross', 'Wishlist GURU - Monthly email limit reached', '${emailQuota[0]?.shop_email}')`
                            //         );

                            //         emailQuotaExceeded = true;  // Set the flag to true after the first call
                            //     }
                            //     break;
                            // }

                        }
                    }
                } catch (error) {
                    webhookErr(error);
                    console.error("Error occurred:", error);
                }
            }
        }
    } catch (error) {
        webhookErr(error);
        console.error(error);
    }
}

export async function subscriptionUpdation(payload, shop) {
    // console.log("WEBHOOK Subscription -- ");
    const session = await shopify.config.sessionStorage.findSessionsByShop(shop);

    // let gidString = payload.app_subscription.admin_graphql_api_id;
    // let parts = gidString.split('/');
    // let numericPart = parts[parts.length - 1];
    // const nameParts = payload.app_subscription.name.split('/');
    // const planName = nameParts[0];
    // const oldPanType = nameParts[1];
    // const planType = oldPanType === 'EVERY_30_DAYS' ? "MONTHLY" : oldPanType

    const countData = await shopify.api.rest.Shop.all({
        session: session[0],
    });
    const shopName = countData.data[0].myshopify_domain;
    const plansData = await shopify.api.rest.RecurringApplicationCharge.all({
        session: session[0],
    });
    let anArray = plansData.data;
    const activePlan = anArray.filter((val) => val.status === "active");
    // console.log("ACTIVE PLAN -- ", activePlan.length);

    database.query(
        `SELECT ail.log_id, ail.plan_id, ail.app_install_id  FROM app_installation_logs as ail, app_installation as ai WHERE ai.shop_name="${shopName}" AND ail.app_install_id = ai.app_install_id ORDER BY ail.log_date DESC LIMIT 1;`,
        async (err, getPrevPlan) => {
            if (err) {
                console.log(err);
            } else {
                // console.log("getPrevPlan --- ", getPrevPlan)
                if (activePlan.length === 0 && getPrevPlan[0].plan_id > 1) {
                    database.query(
                        `INSERT INTO app_installation_logs(app_install_id, plan_id, plan_name, plan_type, log_date) VALUES (${getPrevPlan[0].app_install_id
                        },'1','Free',"null",'${getCurrentDate()}')`,
                        (err, insertingFreePlan) => {
                            if (err) {
                                console.log(err);
                            } else {
                                database.query(
                                    `UPDATE app_installation SET active_plan_id="1" , active_plan_name="Free" WHERE app_install_id=${getPrevPlan[0].app_install_id};`,
                                    (err, updatingPlanName_id) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log("success");
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        }
    );
}

export async function shopUpdate(payload, shop) {
    database.query(
        `UPDATE app_installation SET shopify_plan="${payload.plan_name}" WHERE shop_name="${shop}";`,
        (err, updatingPlanName) => {
            if (err) {
                console.log(err);
            } else {
                console.log("success");
            }
        }
    );
}

export async function updateShopDomain(payload, shop) {
    try {
        const { host } = payload;

        const langUrl = await queryAsync(`SELECT s.lang_id, sl.url FROM ${store_languages_table} AS s INNER JOIN ${store_languages_url_table} AS sl ON s.lang_id = sl.lang_id WHERE s.shop_name = '${shop}'`);
        const tempUrl = await queryAsync(`SELECT id,language FROM ${store_email_temp_table} WHERE shop_name = '${shop}'`);

        const originalLangUrls = JSON.parse(JSON.stringify(langUrl));
        const originalTempUrls = JSON.parse(JSON.stringify(tempUrl));

        const updatedLangUrls = originalLangUrls.map((entry) => {
            const currentDomain = extractDomain(entry.url);
            if (currentDomain !== host) {
                entry.url = replaceDomain(entry.url, host);
            }
            return entry;
        });

        const updatedTempUrls = originalTempUrls.map((entry) => {
            const currentDomain = extractDomain(entry.language);
            if (currentDomain !== host) {
                entry.language = replaceDomain(entry.language, host);
            }
            return entry;
        });

        for (const entry of updatedLangUrls) {
            const original = langUrl.find(e => e.lang_id === entry.lang_id);

            if (original && original.url !== entry.url) {
                await queryAsync(`
          UPDATE ${store_languages_url_table}
          SET url = ?
          WHERE lang_id = ? AND url = ?
        `, [entry.url, entry.lang_id, original.url]);
            }
            // console.log("updated lang url")
        }

        for (const entry of updatedTempUrls) {
            const original = tempUrl.find(e => e.id === entry.id);
            if (original && original.language !== entry.language) {
                await queryAsync(`
          UPDATE ${store_email_temp_table}
          SET language = ?
          WHERE id = ? AND language = ?
        `, [entry.language, entry.id, original.language]);
            }
            // console.log("updated form url")
        }

        // console.log("domain updated in db")
    } catch (error) {
        logger.error(error);
        console.log(error);
    }
}

export async function shopifyPlanUpdate(payload) {
    console.log("SHOPIFY PLAN UPDATE ----- RUNNING ")
    try {
        const now = new Date();
        const formattedNow = now.toISOString().slice(0, 19).replace('T', ' ');

        database.query(
            `SELECT shopify_plan, app_install_id, access_token FROM ${app_installation_table} WHERE shop_name = ?`,
            [payload.myshopify_domain],
            async (err, mainResult) => {
                if (err) {
                    console.error("Database select error:", err);
                    logger.error(err);
                    return;
                }

                if (!mainResult || mainResult.length === 0) {
                    console.warn(`No installation found for shop: ${payload.myshopify_domain}`);
                    return;
                }

                const installation = mainResult[0];

                if (installation.shopify_plan !== "affiliate" && installation.shopify_plan !== "partner_test") {
                    console.log(`No plan change for shop 1: ${payload.myshopify_domain}`);
                    return;
                }

                if (installation.shopify_plan === payload.plan_name) {
                    console.log(`No plan change for shop 2: ${payload.myshopify_domain}`);
                    return;
                }

                database.query(
                    `UPDATE ${app_installation_table} SET active_plan_name = ?, active_plan_id = ?, shopify_plan = ?, updated_date = ?, store_type = ? WHERE shop_name = ?`,
                    ['Free', 1, payload.plan_name, formattedNow, "live", payload.myshopify_domain],
                    (updateErr, updateResult) => {
                        if (updateErr) {
                            console.error("Update error:", updateErr);
                            logger.error(updateErr);
                            return;
                        }

                        if (updateResult.affectedRows > 0) {
                            database.query(
                                `INSERT INTO ${app_installation_log_table} (app_install_id, plan_id, plan_name, payment_type, promo_code) VALUES (?, ?, ?, ?, ?)`,
                                [installation.app_install_id, 1, "Free", "live", null],
                                (logErr) => {
                                    if (logErr) {
                                        console.error("Log insert error:", logErr);
                                        logger.error(logErr);
                                    } else {
                                        console.log("Plan change logged for shop:", payload.myshopify_domain);
                                    }
                                }
                            );
                        }
                    }
                );

                const shopifyNodes = await authSession(payload.myshopify_domain, installation.access_token);
                const activeCharges = await shopifyNodes.recurringApplicationCharge.list();
                const currentPlan = activeCharges.filter(charge => charge.status === 'active');
                await shopifyNodes.recurringApplicationCharge.delete(currentPlan[0]?.id);

                let dataQuery;
                try {
                    dataQuery = await shopifyNodes.graphql(`
            query {
              currentAppInstallation {
                id
              }
            }
          `);
                } catch (graphqlErr) {
                    console.error("GraphQL query failed:", graphqlErr);
                    return;
                }

                if (!dataQuery?.currentAppInstallation?.id) {
                    console.error("Failed to fetch currentAppInstallation from Shopify");
                    return;
                }

                const bodyData = {
                    key: "current-plan",
                    namespace: "wishlist-app",
                    ownerId: dataQuery.currentAppInstallation.id,
                    type: "single_line_text_field",
                    value: "1",
                }

                const { query, variables } = await createAppDataMetafields(bodyData);
                const data = await shopifyNodes.graphql(query, variables);
                console.log("metafield created successfully", data)
            }
        );
    } catch (error) {
        console.log("error", error)
        logger.error(error)
    }
};



// ---------------------extra function that we are using in the webhooks---------------------

export const extractDomain = (url) => {
    try {
        return new URL(url).hostname;
    } catch {
        return url.split('//')[1]?.split('/')[0] || '';
    }
};

export const replaceDomain = (url, newDomain) => {
    try {
        const u = new URL(url);
        u.hostname = newDomain;
        return u.toString();
    } catch {
        const path = url.split('//')[1]?.split('/').slice(1).join('/');
        return `https://${newDomain}/${path}`;
    }
};

const authSession = async (shop, session) => {
    const shopifyNode = await import("shopify-api-node");
    return new shopifyNode.default({
        shopName: shop,
        accessToken: session,
    });
};

async function deleteUserDataAtUninstallation(shopName) {
    try {
        // Fetch the user IDs for the given shopName
        const userIdsResult = await databaseQuery(`SELECT id FROM wishlist_users WHERE shop_name = '${shopName}'`);
        // console.log("userIds ------- ", userIdsResult);

        // Loop through each user ID
        for (const row of userIdsResult) {
            // Fetch wishlist IDs associated with the current user
            const wishlistIdsResult = await databaseQuery(`SELECT wishlist_id FROM wishlist WHERE wishlist_user_id=${row.id}`);

            for (const row1 of wishlistIdsResult) {
                // First, delete the items from the wishlist_items table
                await databaseQuery(`DELETE FROM wishlist_items WHERE wishlist_id=${row1.wishlist_id}`);
                console.log("Items deleted -----------------");

                await databaseQuery(`DELETE FROM cart_items WHERE wishlist_id=${row1.wishlist_id}`);
                console.log("cart_items deleted -----------------");

                // Then, delete the wishlist
                await databaseQuery(`DELETE FROM wishlist WHERE wishlist_id=${row1.wishlist_id}`);
                console.log("Wishlist deleted -----------------");
            }

            // Finally, delete the wishlist user
            await databaseQuery(`DELETE FROM wishlist_users WHERE id=${row.id}`);
            console.log("Wishlist user deleted -----------------");
        }

        // new codeee----------
        await databaseQuery(`DELETE FROM wishlist_share_stats WHERE shop_name='${shopName}'`);
        console.log("wishlist_share_stats deleted -----------------");

        const languageIdsResult = await databaseQuery(`SELECT lang_id FROM store_languages WHERE shop_name='${shopName}'`);
        // console.log("language Ids ------- ", languageIdsResult);

        for (const rowLang of languageIdsResult) {
            await databaseQuery(`DELETE FROM store_languages_url WHERE lang_id=${rowLang.lang_id}`);
            console.log("store_languages_url deleted -----------------");

            await databaseQuery(`DELETE FROM store_languages WHERE lang_id=${rowLang.lang_id}`);
            console.log("store_languages deleted -----------------");
        }

        await databaseQuery(`DELETE FROM store_email_templates WHERE shop_name='${shopName}'`);
        console.log("store_email_templates deleted ----------------- ");

        // latest neww----------
        await databaseQuery(`DELETE FROM social_like WHERE shop_name='${shopName}'`);
        console.log("social_like deleted ----------------- ");

        await databaseQuery(`DELETE FROM email_reports WHERE shop_name='${shopName}'`);
        console.log("email_reports deleted ----------------- ");

        await databaseQuery(`DELETE FROM email_reminder WHERE shop_name='${shopName}'`);
        console.log("email_reminder deleted ----------------- ");

        await databaseQuery(`DELETE FROM klaviyo WHERE shop_name='${shopName}'`);
        console.log("klaviyo deleted ----------------- ");

    } catch (err) {
        console.log(err);
        logger.error(err);
    }
}

async function returnEmailQuota(shopName) {
    return await new Promise((resolve, reject) => {
        database.query(
            `SELECT ai.shop_email, ai.customer_email, ai.store_owner, p.email_quota, (SELECT COUNT(er.email_type) FROM email_reports as er WHERE shop_name="${shopName}" AND MONTH(er.date) = MONTH(CURRENT_DATE()) AND YEAR(er.date) = YEAR(CURRENT_DATE())) AS emails_sent FROM app_installation AS ai JOIN plan AS p ON ai.active_plan_id = p.plan_id WHERE ai.shop_name='${shopName}';`,
            (err, emailResult) => {
                if (err) {
                    webhookErr(err);
                    reject(err);
                } else {
                    resolve(emailResult);
                }
            }
        );
    });
}

function webhookErr(reason) {
    fs.appendFile(
        "webhook_status.log",
        `${new Date().toISOString()}: Unhandled Rejection at:   reason:, ${reason} `,
        (err) => {
            if (err) {
                console.error(`Error appending to webhook_status.log: ${err}`);
            }
        }
    );
}

function databaseQuery(query) {
    return new Promise((resolve, reject) => {
        database.query(query, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

const checkKlaviyoRecord = async (shopName) => {
    try {
        const result = await new Promise((resolve, reject) => {
            database.query(
                `SELECT * FROM ${klaviyo_table} WHERE shop_name='${shopName}'`,
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });

        return result;
    } catch (error) {
        logger.error(error);

    }
};

export async function checkKlaviyoApiKey(apiKey) {

    const url = 'https://a.klaviyo.com/api/accounts';
    const options = {
        headers: {
            accept: 'application/vnd.api+json',
            revision: '2024-10-15',
            Authorization: `Klaviyo-API-Key ${apiKey}`,
        },
    };

    const maxRetries = 5;
    let retries = 0;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (retries < maxRetries) {
        try {
            const response = await axios.get(url, options);

            // Check if there are errors in the response
            if (response.data.errors) {
                return { type: 'error' };
            } else {
                return { type: 'success', data: response.data.data };
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                // Handle rate-limited error by waiting and retrying
                retries++;
                const retryAfter = error.response.headers['retry-after']
                    ? parseInt(error.response.headers['retry-after']) * 1000
                    : Math.pow(2, retries) * 1000; // Exponential backoff
                // console.log(`Rate limit exceeded. Retrying in ${retryAfter / 1000} seconds...`);
                logger.error(`Rate limit exceeded. Retrying in ${retryAfter / 1000} seconds...`);

                await delay(retryAfter); // Wait for retryAfter or exponential backoff
            } else {
                // Handle other errors
                // console.error('Request failed', error);
                logger.error(error);
                return { type: 'error' };
            }
        }
    }

    return { type: 'error', message: 'Max retries exceeded' };
}

const checkEmailSubscribeOrNot = (data, authKey) => {

    const {
        customerEmail
    } = data;

    fetch(`https://a.klaviyo.com/api/profiles/?filter=email='${customerEmail}'`, {
        method: 'GET',
        headers: {
            accept: 'application/json',
            revision: '2025-04-15',
            Authorization: `Klaviyo-API-Key ${authKey}`
        }
    })
        .then(res => res.json())
        .then(data => {
            const profile = data.data?.[0];
            const consentStatus = profile?.attributes?.subscriptions?.email?.marketing?.consent;
            if (consentStatus === 'SUBSCRIBED') {
                console.log('User is already subscribed to marketing emails.');
            } else {
                // Proceed to subscribe
                subscribeUser(customerEmail, authKey);
            }
        })
        .catch(err => console.error('Error checking subscription:', err));
}

export function subscribeUser(customerEmail, authKey) {
    const url = 'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs';

    const payload = {
        data: {
            type: 'profile-subscription-bulk-create-job',
            attributes: {
                profiles: {
                    data: [
                        {
                            type: 'profile',
                            attributes: {
                                email: customerEmail,
                                subscriptions: {
                                    email: {
                                        marketing: {
                                            consent: 'SUBSCRIBED'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    };

    const options = {
        method: 'POST',
        headers: {
            Accept: 'application/vnd.api+json',
            Revision: '2025-04-15',
            'Content-Type': 'application/vnd.api+json',
            Authorization: `Klaviyo-API-Key ${authKey}`
        },
        body: JSON.stringify(payload)
    };

    fetch(url, options)
        .then(async res => {
            const contentType = res.headers.get('content-type');
            const status = res.status;

            // Handle empty body or non-JSON
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`API error ${status}: ${errorText}`);
            }

            if (contentType && contentType.includes('application/json')) {
                const data = await res.json();
                // console.log('✅ Subscription result:', data);
            } else {
                // console.log(`✅ Subscription succeeded (no JSON returned) — Status: ${status}`);
            }
        })
        .catch(err => {
            console.error('❌ Subscription error:', err.message || err);
        });
}

async function KlaviyoIntegrationEmailRemainderFxn(req, checkKlaviyoRecordExist, email, params, shopName) {
    await KlaviyoCreateEventEmailRemainder(req, checkKlaviyoRecordExist[0]?.private_key, email, params, shopName)

    const data = {
        customerEmail: email
    };
    await checkEmailSubscribeOrNot(data, checkKlaviyoRecordExist[0]?.private_key);
}

function calculateDropPercentage(previousPrice, updatedPrice) {
    return ((previousPrice - updatedPrice) / previousPrice) * 100;
}

async function updateProductPrice(productId, newPrice) {
    await queryDatabase(`UPDATE ${product_table} SET price = ? WHERE id = ?`, [newPrice, productId]);
}

async function handleEmailQuotaExceeded(emailQuota, shopName) {
    let mailHtml = emailQuotaLimitHTML(emailQuota[0]?.store_owner, shopName);
    let emailContent = {
        from: supportEmail,
        to: emailQuota[0]?.shop_email,
        cc: emailQuota[0]?.customer_email,
        subject: "Wishlist GURU - Monthly email limit reached",
        html: mailHtml,
    };
    sendEmail(emailContent);
    console.log("Email limit reached. Exiting process.");
}

const queryAsync = (query, params) => {
    return new Promise((resolve, reject) => {
        database.query(query, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

function queryDatabase(query, params = []) {
    return new Promise((resolve, reject) => {
        database.query(query, params, (err, result) => {
            if (err) {
                webhookErr(err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function getCurrentDate() {
    const currentDate = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const options = {
        timeZone: timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    };
    let formattedDate = currentDate.toLocaleString("en-US", options);
    if (currentDate.getHours() === 0) {
        formattedDate = formattedDate.replace(/^24/, "00");
    }
    const finalFormattedDate = formattedDate.replace(
        /(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})/,
        (match, month, day, year, time) => `${year}-${month}-${day} ${time}`
    );
    return finalFormattedDate;
}
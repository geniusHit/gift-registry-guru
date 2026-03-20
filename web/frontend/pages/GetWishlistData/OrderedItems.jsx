import { AlphaCard, Text, IndexFilters, IndexTable, LegacyCard, Pagination, useSetIndexFiltersMode, IndexFiltersMode, Spinner } from '@shopify/polaris'
import React from 'react'

const OrderedItems = ({ myLanguage: myLanguage, sortOptions: sortOptions, sortCartSelected: sortCartSelected, queryCartValue: queryCartValue, handleFiltersQueryChange: handleFiltersQueryChange, setQueryCartValue: setQueryCartValue, handleFiltersClearAll: handleFiltersClearAll, cartData: cartData, orderedItemsTable: orderedItemsTable, startIndexCartValue: startIndexCartValue, totalRecordsCart: totalRecordsCart, handleSortCartChange: handleSortCartChange, getOrdersPageNo: getOrdersPageNo, handleOrdersPagination, isCartLoading: isCartLoading, hasOrdersPrevious, hasOrdersNext, totalOrderedItems }) => {
    const { mode, setMode } = useSetIndexFiltersMode(IndexFiltersMode.Filtering);
    const onHandleCancel = () => { };

    console.log("orderedItemsTable = ", orderedItemsTable)

    return (
        <div className='wf-wishListDataTable'>
            <div className='wf-style-wishbtn'>
                <Text variant="headingLg" as="h2">Ordered Items</Text>
                <p>{myLanguage.userListingText}</p>

                <AlphaCard roundedAbove="sm">
                    {isCartLoading ?
                        <div style={{ textAlign: 'center' }}><Spinner accessibilityLabel="Spinner example" size="large" />
                        </div>
                        :
                        <div className='customer-recently-table'>
                            <IndexFilters
                                sortOptions={sortOptions}
                                sortSelected={sortCartSelected}
                                queryValue={queryCartValue}
                                queryPlaceholder="Searching in all"
                                onQueryChange={(value) => { handleFiltersQueryChange(value, "cart") }}
                                onQueryClear={() => setQueryCartValue('')}
                                onSort={handleSortCartChange}
                                cancelAction={{
                                    onAction: onHandleCancel,
                                    disabled: false,
                                    loading: false,
                                }}
                                tabs={[]}
                                filters={[]}
                                onClearAll={() => handleFiltersClearAll("cart")}
                                mode={mode}
                                setMode={setMode}
                            />
                            <IndexTable
                                itemCount={cartData.length}

                                selectable={false}
                                headings={[
                                    { title: myLanguage.tableSrno },
                                    { title: "Order Id" },
                                    { title: myLanguage.productTitle },
                                    { title: myLanguage.productImage },
                                    { title: myLanguage.productPrice },
                                    { title: myLanguage.productQuantity },
                                    { title: myLanguage.productTotalPrice },
                                ]}
                            >
                                {orderedItemsTable}
                            </IndexTable>
                            <div className='polaris_pagination datePerRecord-pagination'>
                                <Pagination
                                    onPrevious={() => {
                                        handleOrdersPagination(parseInt(getOrdersPageNo) - 1)
                                    }}
                                    onNext={() => {
                                        handleOrdersPagination(parseInt(getOrdersPageNo) + 1)
                                    }}
                                    hasNext={hasOrdersNext}
                                    hasPrevious={hasOrdersPrevious}
                                    label={`Total ${totalOrderedItems} items`}
                                    accessibilityLabel="Pagination"
                                    nextTooltip="Next page"
                                    previousTooltip="Previous page"
                                    type="table"
                                />
                            </div>
                        </div>}
                </AlphaCard>
            </div>
        </div>
    )
}

export default OrderedItems
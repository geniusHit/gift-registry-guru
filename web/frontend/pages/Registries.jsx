import React, { useState, useCallback } from 'react'
import { Button } from '@shopify/polaris';
import addIcon from '../assets/PlusCircleIcon.svg'
import {
    TextField,
    IndexTable,
    LegacyCard,
    IndexFilters,
    useSetIndexFiltersMode,
    useIndexResourceState,
    Text,
    ChoiceList,
    RangeSlider,
    Badge,
} from '@shopify/polaris';
import { useLocation } from 'react-router-dom'
import { Constants } from '../../backend/constants/constant';

const Registries = () => {
    const location = useLocation()
    console.log("location.pathname = ", location.pathname)

    const sleep = (ms) =>
        new Promise((resolve) => setTimeout(resolve, ms));
    const [itemStrings, setItemStrings] = useState([
        'All',
        'Active',
        'Past',
        'Archived',
        'Customer Deleted',
    ]);
    const deleteView = (index) => {
        const newItemStrings = [...itemStrings];
        newItemStrings.splice(index, 1);
        setItemStrings(newItemStrings);
        setSelected(0);
    };

    const duplicateView = async (name) => {
        setItemStrings([...itemStrings, name]);
        setSelected(itemStrings.length);
        await sleep(1);
        return true;
    };

    const tabs = itemStrings.map((item, index) => ({
        content: item,
        index,
        onAction: () => { },
        id: `${item}-${index}`,
        isLocked: index === 0,
        actions:
            index === 0
                ? []
                : [
                    {
                        type: 'rename',
                        onAction: () => { },
                        onPrimaryAction: async (value) => {
                            const newItemsStrings = tabs.map((item, idx) => {
                                if (idx === index) {
                                    return value;
                                }
                                return item.content;
                            });
                            await sleep(1);
                            setItemStrings(newItemsStrings);
                            return true;
                        },
                    },
                    {
                        type: 'duplicate',
                        onPrimaryAction: async (value) => {
                            await sleep(1);
                            duplicateView(value);
                            return true;
                        },
                    },
                    {
                        type: 'edit',
                    },
                    {
                        type: 'delete',
                        onPrimaryAction: async () => {
                            await sleep(1);
                            deleteView(index);
                            return true;
                        },
                    },
                ],
    }));
    const [selected, setSelected] = useState(0);
    const onCreateNewView = async (value) => {
        await sleep(500);
        setItemStrings([...itemStrings, value]);
        setSelected(itemStrings.length);
        return true;
    };
    const sortOptions = [
        { label: 'Registry', value: 'registry', directionLabel: 'Ascending' },
        { label: 'Owner', value: 'owner', directionLabel: 'Descending' },
        { label: 'Status', value: 'status', directionLabel: 'A-Z' },
        { label: 'Event Type', value: 'customer desc', directionLabel: 'Z-A' },
        { label: 'Event Date', value: 'date asc', directionLabel: 'A-Z' },
        { label: 'Event Date', value: 'date desc', directionLabel: 'Z-A' },
        { label: 'Date Created', value: 'created desc', directionLabel: 'Z-A' },
        { label: 'Date Created', value: 'created asc', directionLabel: 'A-Z' },
        { label: 'Products', value: 'products', directionLabel: 'A-Z' },
        { label: 'Sales', value: 'sales', directionLabel: 'A-Z' },
        { label: 'Potential Value', value: 'potential value', directionLabel: 'A-Z' },
        { label: 'Action', value: 'action', directionLabel: 'A-Z' }
    ];
    const [sortSelected, setSortSelected] = useState(['order asc']);
    const { mode, setMode } = useSetIndexFiltersMode();
    const onHandleCancel = () => { };

    const onHandleSave = async () => {
        await sleep(1);
        return true;
    };

    const primaryAction =
        selected === 0
            ? {
                type: 'save-as',
                onAction: onCreateNewView,
                disabled: false,
                loading: false,
            }
            : {
                type: 'save',
                onAction: onHandleSave,
                disabled: false,
                loading: false,
            };
    const [accountStatus, setAccountStatus] = useState(
        undefined,
    );
    const [moneySpent, setMoneySpent] = useState(
        undefined,
    );
    const [taggedWith, setTaggedWith] = useState('');
    const [queryValue, setQueryValue] = useState('');

    const handleAccountStatusChange = useCallback(
        (value) => setAccountStatus(value),
        [],
    );
    const handleMoneySpentChange = useCallback(
        (value) => setMoneySpent(value),
        [],
    );
    const handleTaggedWithChange = useCallback(
        (value) => setTaggedWith(value),
        [],
    );
    const handleFiltersQueryChange = useCallback(
        (value) => setQueryValue(value),
        [],
    );
    const handleAccountStatusRemove = useCallback(
        () => setAccountStatus(undefined),
        [],
    );
    const handleMoneySpentRemove = useCallback(
        () => setMoneySpent(undefined),
        [],
    );
    const handleTaggedWithRemove = useCallback(() => setTaggedWith(''), []);
    const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);
    const handleFiltersClearAll = useCallback(() => {
        handleAccountStatusRemove();
        handleMoneySpentRemove();
        handleTaggedWithRemove();
        handleQueryValueRemove();
    }, [
        handleAccountStatusRemove,
        handleMoneySpentRemove,
        handleQueryValueRemove,
        handleTaggedWithRemove,
    ]);

    const filters = [
        {
            key: 'accountStatus',
            label: 'Account status',
            filter: (
                <ChoiceList
                    title="Account status"
                    titleHidden
                    choices={[
                        { label: 'Enabled', value: 'enabled' },
                        { label: 'Not invited', value: 'not invited' },
                        { label: 'Invited', value: 'invited' },
                        { label: 'Declined', value: 'declined' },
                    ]}
                    selected={accountStatus || []}
                    onChange={handleAccountStatusChange}
                    allowMultiple
                />
            ),
            shortcut: true,
        },
        {
            key: 'taggedWith',
            label: 'Tagged with',
            filter: (
                <TextField
                    label="Tagged with"
                    value={taggedWith}
                    onChange={handleTaggedWithChange}
                    autoComplete="off"
                    labelHidden
                />
            ),
            shortcut: true,
        },
        {
            key: 'moneySpent',
            label: 'Money spent',
            filter: (
                <RangeSlider
                    label="Money spent is between"
                    labelHidden
                    value={moneySpent || [0, 500]}
                    prefix="$"
                    output
                    min={0}
                    max={2000}
                    step={1}
                    onChange={handleMoneySpentChange}
                />
            ),
        },
    ];

    const appliedFilters = [];
    if (accountStatus && !isEmpty(accountStatus)) {
        const key = 'accountStatus';
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, accountStatus),
            onRemove: handleAccountStatusRemove,
        });
    }
    if (moneySpent) {
        const key = 'moneySpent';
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, moneySpent),
            onRemove: handleMoneySpentRemove,
        });
    }
    if (!isEmpty(taggedWith)) {
        const key = 'taggedWith';
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, taggedWith),
            onRemove: handleTaggedWithRemove,
        });
    }

    const orders = [
        {
            id: '1020',
            order: (
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                    #1020
                </Text>
            ),
            date: 'Jul 20 at 4:34pm',
            customer: 'Jaydon Stanton',
            total: '$969.44',
            paymentStatus: <Badge progress="complete">Paid</Badge>,
            fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
        },
        {
            id: '1019',
            order: (
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                    #1019
                </Text>
            ),
            date: 'Jul 20 at 3:46pm',
            customer: 'Ruben Westerfelt',
            total: '$701.19',
            paymentStatus: <Badge progress="partiallyComplete">Partially paid</Badge>,
            fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
        },
        {
            id: '1018',
            order: (
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                    #1018
                </Text>
            ),
            date: 'Jul 20 at 3.44pm',
            customer: 'Leo Carder',
            total: '$798.24',
            paymentStatus: <Badge progress="complete">Paid</Badge>,
            fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
        },
    ];
    const resourceName = {
        singular: 'order',
        plural: 'orders',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(orders);

    const rowMarkup = orders.map(
        (
            { id, order, date, customer, total, paymentStatus, fulfillmentStatus },
            index,
        ) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {order}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{date}</IndexTable.Cell>
                <IndexTable.Cell>{customer}</IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" alignment="end" numeric>
                        {total}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{paymentStatus}</IndexTable.Cell>
                <IndexTable.Cell>{fulfillmentStatus}</IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    function disambiguateLabel(key, value) {
        switch (key) {
            case 'moneySpent':
                return `Money spent is between $${value[0]} and $${value[1]}`;
            case 'taggedWith':
                return `Tagged with ${value}`;
            case 'accountStatus':
                return (value).map((val) => `Customer ${val}`).join(', ');
            default:
                return value;
        }
    }

    function isEmpty(value) {
        if (Array.isArray(value)) {
            return value.length === 0;
        } else {
            return value === '' || value == null;
        }
    }

    const { serverURL } = Constants
    async function getRegistries() {
        try {
            let dataToSendInBody;
            dataToSendInBody = {
                shopName: permanentDomain,
                customerEmail: getCurrentLogin,
                shopDomain: shopDomain,
                currentToken: getAccessTokenFromCookie(),
                // currentToken: localStorage.getItem("access-token"),
                langName: btoa(`${customLanguage.textMsgLanguage}Message`),
            };
            const userData = await fetch(`${serverURL}/get-all-items`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSendInBody),
            });
            let result = await userData.json();
        }
        catch (err) {
            console.log(err)
        }
    }

    return (
        <div id='registries'>
            <div className='nav'>
                <p>Registries</p>

                <div className='header'>
                    <Button size='micro'>
                        <img src={addIcon} className='icon' />Create Registry
                    </Button>
                    <div className='vertical-line'></div>
                    <Button size='micro'>
                        Dashboard
                    </Button>
                    <Button size='micro' pressed>
                        Registries
                    </Button>
                    <Button size='micro'>
                        Wishlists
                    </Button>
                    <Button size='micro'>
                        Settings
                    </Button>
                    <Button size='micro'>
                        Billing
                    </Button>
                    <Button size='micro'>
                        Support
                    </Button>
                </div>
            </div>

            <LegacyCard>
                <IndexFilters
                    sortOptions={sortOptions}
                    sortSelected={sortSelected}
                    queryValue={queryValue}
                    queryPlaceholder="Searching in all"
                    onQueryChange={handleFiltersQueryChange}
                    onQueryClear={() => setQueryValue('')}
                    onSort={setSortSelected}
                    primaryAction={primaryAction}
                    cancelAction={{
                        onAction: onHandleCancel,
                        disabled: false,
                        loading: false,
                    }}
                    tabs={tabs}
                    selected={selected}
                    onSelect={setSelected}
                    canCreateNewView
                    onCreateNewView={onCreateNewView}
                    filters={filters}
                    appliedFilters={appliedFilters}
                    onClearAll={handleFiltersClearAll}
                    mode={mode}
                    setMode={setMode}
                />
                <IndexTable
                    resourceName={resourceName}
                    itemCount={orders.length}
                    selectedItemsCount={
                        allResourcesSelected ? 'All' : selectedResources.length
                    }
                    onSelectionChange={handleSelectionChange}
                    headings={[
                        { title: 'Registry' },
                        { title: 'Owner' },
                        { title: 'Status' },
                        { title: 'Event Type', alignment: 'end' },
                        { title: 'Event Date' },
                        { title: 'Date Created' },
                        { title: 'Products' },
                        { title: 'Sales' },
                        { title: 'Potential Value' },
                        { title: 'Action' },
                    ]}
                >
                    {rowMarkup}
                </IndexTable>
            </LegacyCard>
        </div>
    )
}

export default Registries
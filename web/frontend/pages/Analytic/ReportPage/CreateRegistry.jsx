import React, { useState, useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Form, FormLayout, Checkbox, TextField, Button, Select, Grid, Popover, DatePicker, Box, Icon, Tag, InlineStack, Text } from '@shopify/polaris';
import {
    XSmallIcon
} from '@shopify/polaris-icons';
import SaveBar from '../../SaveBar';
import useAppMetafield from '../../../hooks/useAppMetafield';
import SkeletonPage1 from '../../SkeletonPage1';
import { SaveBar as NewSaveBar, useAppBridge } from '@shopify/app-bridge-react'
import useApi from '../../../hooks/useApi';
import { Constants } from '../../../../backend/constants/constant';
import useUtilityFunction from '../../../hooks/useUtilityFunction';
import Footer from '../../Footer';

const CreateRegistry = () => {
    const { control, handleSubmit, setValue } = useForm({
        defaultValues: {
            name: "",
        }
    })
    const [saveBar, setSaveBar] = useState(true)
    const [eventOptions, setEventOptions] = useState([])
    const appMetafield = useAppMetafield();
    const [isloading, setIsLoading] = useState(false);
    const [popoverActive, setPopoverActive] = useState(false);
    const [{ month, year }, setDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
    const [tag, setTag] = useState([]);
    const ShopApi = useApi();
    const [userData, setUserData] = useState()
    const { serverURL } = Constants;
    const utilityFunction = useUtilityFunction();
    const [myLanguage, setMyLanguage] = useState({});
    let wfGetDomain = window.location.href;
    const [registryData, setRegistryData] = useState({
        name: "",
        eventType: "",
        eventData: "",
        tags: [],
        description: "",
        urlType: "",
        firstName: "",
        lastName: "",
        streetAddress: "",
        state: "",
        zipCode: "",
        country: "",
        city: "",
        phoneNumber: ""
    })
    const [selectedDate, setSelectedDate] = useState(new Date());
    const submit = (data) => {
        console.log("data = ", data)
        createRegistry(data.name, data.description, data.urlType, data.password, data.eventDate, data.eventType, data.firstName, data.lastName, data.streetAddress, data.zipCode, data.city, data.state, data.country, data.phoneNumber, data.tags)
    };
    const handleChangeName = (value) => {
        setRegistryData((prev) => ({ ...prev, name: value }))
        // showSaveBar()
    }
    const handleChangeTags = (value) => {
        setTag(value)
        // showSaveBar()
    }
    const handleChangeDescription = (value) => {
        setRegistryData((prev) => ({ ...prev, description: value }))
    }
    const handleChangePassword = (value) => {
        setRegistryData((prev) => ({ ...prev, password: value }))
    }
    const handleChangeFName = (value) => {
        setRegistryData((prev) => ({ ...prev, firstName: value }))
    }
    const handleChangeLName = (value) => {
        setRegistryData((prev) => ({ ...prev, lastName: value }))
    }
    const handleChangeStreetAddress = (value) => {
        setRegistryData((prev) => ({ ...prev, streetAddress: value }))
    }
    const handleChangeState = (value) => {
        setRegistryData((prev) => ({ ...prev, state: value }))
    }
    const handleChangeZipCode = (value) => {
        setRegistryData((prev) => ({ ...prev, zipCode: value }))
    }
    const handleChangeCountry = (value) => {
        setRegistryData((prev) => ({ ...prev, country: value }))
    }
    const handleChangeCity = (value) => {
        setRegistryData((prev) => ({ ...prev, city: value }))
    }
    const handleChangePhone = (value) => {
        setRegistryData((prev) => ({ ...prev, phoneNumber: value }))
    }

    useEffect(() => {
        useEffectLite()
    }, [])

    const useEffectLite = async () => {
        setIsLoading(true)
        await getAllAppDataMetafields()
        const shopApi = await ShopApi.shop();
        setUserData(shopApi)
        const currentLanguage = await utilityFunction.getCurrentLanguage();
        setMyLanguage(currentLanguage);
        setIsLoading(false)
    }

    async function getAllAppDataMetafields() {
        const dataArray = await appMetafield.getAllAppMetafields();
        let generalData = null;
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].node.key === "general-setting") {
                let dData = JSON.parse(dataArray[i].node.value);
                generalData = dData;
            };
        }

        if (generalData) {
            setEventOptions(JSON.parse(generalData?.eventOption || []));
        }
    };

    const handleSelectChangeEventOptions = useCallback(
        (value) => {
            setRegistryData(prev => ({ ...prev, eventType: value }));
            setSaveBar(true)
        },
        [],
    );

    if (eventOptions.length > 0) {
        setValue("eventType", eventOptions[0].value)
        console.log("eventOptions[0] = ", eventOptions[0].value)
    }
    // console.log("eventOptions[0].value = ", eventOptions[0].value)
    console.log("eventOptions = ", eventOptions)

    const togglePopover = useCallback(
        () => setPopoverActive((active) => !active),
        []
    );

    const date = new Date()
    const activator = (
        <TextField
            value={selectedDate?.toLocaleDateString("en-CA") || date.toLocaleDateString("en-CA")}
            onFocus={togglePopover}
            autoComplete="off"
        />
    );

    const handleMonthChange = useCallback(
        (month, year) => {
            setDate({ month, year })
        },
        [],
    );

    const handleDateChange = useCallback(({ start }) => {
        setSelectedDate(start);
        setRegistryData(prev => ({ ...prev, eventDate: start.toLocaleDateString("en-CA") }));
        setPopoverActive(false);
        setSaveBar(true)
    }, []);

    console.log("selectedDate = ", selectedDate)

    const addTag = () => {
        console.log("tag = ", tag);

        setRegistryData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
        setTag("")
    }

    console.log("registryData = ", registryData)

    const removeTag = (index) => {
        console.log("index = ", index)
        let newTags = registryData?.tags.filter((tag, i) => i !== index);
        console.log("newTags = ", newTags)
        setRegistryData((prev) => ({ ...prev, tags: newTags }))
    }

    const [showPasswordField, setShowPasswordField] = useState(false)
    const urlOptions = [
        { label: "Public", value: "public" },
        { label: "Private", value: "private" },
        { label: "Password Protected", value: "password-protected" },
    ]
    const handleSelectChangeUrlOptions = useCallback(
        (value) => {
            setRegistryData(prev => ({ ...prev, urlType: value }));
            setSaveBar(true)
            value === "password-protected" ? setShowPasswordField(true) : setShowPasswordField(false)
        },
        [],
    );

    async function createRegistry(wishName, wishDescrp, wishUrlType, wishUrlPassword = "", wishDate, wishEventType, wishFirstName, wishLastName, wishStreetAddress, wishZipCode, wishCity, wishState, wishCountry, wishPhone, wishTags) {
        const shopApi = await ShopApi.shop();
        console.log("shopApi = ", shopApi)
        let params = (new URL(document.location)).searchParams;
        let sharedId = params.get("id");
        const sharedIdProp = atob(sharedId);
        const userData = await fetch(`${serverURL}/create-new-wihlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                wishlistName: [wishName],
                wishlistDescription: wishDescrp,
                wishlistUrlType: wishUrlType,
                password: wishUrlPassword,
                date: wishDate,
                eventType: wishEventType,
                firstName: wishFirstName,
                lastName: wishLastName,
                streetAddress: wishStreetAddress,
                zipCode: wishZipCode,
                city: wishCity,
                state: wishState,
                country: wishCountry,
                phone: wishPhone,
                tags: JSON.stringify(wishTags),
                shopName: shopApi.domain,
                customerEmail: shopApi.customerEmail,
                // currentToken: accessToken,
                storeName: shopApi.shopName,
                language: wfGetDomain,
                referral_id: ""
            }),
        });
        let result = await userData.json();
        console.log("result = ", result)

        // if (result.msg === "wishlist created successfully") {
        //     wgrCreateRegistryForm();
        //     window.location = `${wfGetDomain}apps/wf-gift-registry/list`;
        // } else 
        // if (result.msg === "registry limit crossed") {
        //     alertContent("Limit crossed for creating the registry");
        // }
    }

    function getAccessToken() {
        let accessToken;
        // if (localStorage.getItem("access-token") === null) {
        if (getAccessTokenFromCookie() === null) {
            const newDATE = new Date();
            const formattedDateTime = newDATE.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
            accessToken = btoa((Math.random() + 1).toString(36).substring(2) + formattedDateTime);
            saveAccessTokenInCookie(accessToken)
            // if (permanentDomain === 'wantitbuyit-wibi.myshopify.com') {
            //     document.cookie = `access-token=${accessToken}; path=/; domain=.wibi.com.kw; secure`;
            // } else {
            //     localStorage.setItem("access-token", accessToken);
            // }
            // accessToken = btoa((Math.random() + 1).toString(36).substring(2) + formattedDateTime);
            // localStorage.setItem("access-token", accessToken);
        } else {
            accessToken = getAccessTokenFromCookie();
            // accessToken = localStorage.getItem("access-token");
        }
        let accessEmail;
        if (getCustomerEmailFromCookie() === null) {
            accessEmail = customerEmail;
            saveCustomerEmailInCookie(customerEmail);
            // localStorage.setItem("customer-email", customerEmail);
        }
        else {
            if (getCustomerEmailFromCookie() === customerEmail) {
                accessEmail = getCustomerEmailFromCookie();
            }
            else {
                if (getCustomerEmailFromCookie() !== "" && customerEmail === "") {
                    accessEmail = getCustomerEmailFromCookie();
                }
                else {
                    if (getCustomerEmailFromCookie() !== "" && getCustomerEmailFromCookie() !== customerEmail) {
                        accessEmail = customerEmail;
                        saveCustomerEmailInCookie(customerEmail);
                        // localStorage.setItem("customer-email", customerEmail);
                    }
                    else {
                        accessEmail = customerEmail;
                        saveCustomerEmailInCookie(customerEmail);
                        // localStorage.setItem("customer-email", customerEmail);
                    }
                }
            }
        }
        return { accessToken, accessEmail }
    }

    console.log("userData = ", userData)
    console.log("myLanguage = ", myLanguage)

    return (
        <div className='wf-dashboard wf-dashboard-report wf-userReport ' style={{ padding: "70px" }}>
            {isloading ? <SkeletonPage1 /> :
                <Form onSubmit={handleSubmit(submit)}>
                    <FormLayout>
                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                                <Text variant="headingLg">Create Registry</Text>
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                                <Controller
                                    control={control}
                                    name='name'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangeName(value) }} value={registryData?.name} placeholder='Enter registry name' />
                                    )}
                                />
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='eventType'
                                    render={({ field }) => (
                                        <Select
                                            options={eventOptions}
                                            onChange={(value) => { field.onChange(value); handleSelectChangeEventOptions(value); }}
                                            value={registryData?.eventType}
                                            placeholder='Choose Event'
                                        />
                                    )}
                                />
                            </Grid.Cell>

                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='eventDate'
                                    render={({ field }) => (
                                        <Popover
                                            active={popoverActive}
                                            activator={activator}
                                            onClose={togglePopover}
                                            preferredAlignment="left"
                                        >
                                            <Popover.Pane fixed>
                                                <DatePicker
                                                    month={month}
                                                    year={year}
                                                    onMonthChange={handleMonthChange}
                                                    selected={{ start: selectedDate, end: selectedDate }}
                                                    onChange={(value) => {
                                                        let date = value.start;
                                                        field.onChange(date.toLocaleDateString("en-CA")); handleDateChange(value);
                                                    }}
                                                />
                                            </Popover.Pane>
                                        </Popover>
                                    )}
                                />
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 11, sm: 11, md: 11, lg: 11, xl: 11 }}>
                                <Controller
                                    control={control}
                                    name='tag'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangeTags(value) }} value={tag} placeholder='Enter tag' />
                                    )}
                                />
                            </Grid.Cell>

                            <Grid.Cell columnSpan={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}>
                                <Controller
                                    control={control}
                                    name='addTag'
                                    render={({ field }) => (
                                        <Button size='large' fullWidth onClick={(value) => addTag(value)}>Add</Button>
                                    )}
                                />
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                                <InlineStack gap="400" wrap>
                                    {registryData?.tags.map((tag, index) => {
                                        return (
                                            <Tag
                                                key={index}
                                                onRemove={() => removeTag(index)}
                                            >
                                                {tag}
                                            </Tag>
                                        );
                                    })}
                                </InlineStack>
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                                <Controller
                                    control={control}
                                    name='description'
                                    render={({ field }) => (
                                        <TextField multiline={3} onChange={(value) => { field.onChange(value); handleChangeDescription(value) }} value={registryData?.description} placeholder='Enter registry description' />
                                    )}
                                />
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                                <Controller
                                    control={control}
                                    name='urlType'
                                    render={({ field }) => (
                                        <Select
                                            options={urlOptions}
                                            onChange={(value) => { field.onChange(value); handleSelectChangeUrlOptions(value); }}
                                            value={registryData?.urlType}
                                            placeholder='Share url type'
                                        />
                                    )}
                                />
                            </Grid.Cell>
                        </Grid>

                        {
                            showPasswordField && <Grid>
                                <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                                    <Controller
                                        control={control}
                                        name='password'
                                        render={({ field }) => (
                                            <TextField type='password' onChange={(value) => { field.onChange(value); handleChangePassword(value) }} value={registryData?.password} placeholder='Enter password' />
                                        )}
                                    />
                                </Grid.Cell>
                            </Grid>
                        }

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='firstName'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangeFName(value) }} value={registryData?.firstName} placeholder='Enter First Name' />
                                    )}
                                />
                            </Grid.Cell>

                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='lastName'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangeLName(value) }} value={registryData?.lastName} placeholder='Enter Last Name' />
                                    )}
                                />
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Text>Registrant’s Information</Text>
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='streetAddress'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangeStreetAddress(value) }} value={registryData?.streetAddress} placeholder='Street Address' />
                                    )}
                                />
                            </Grid.Cell>

                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='state'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangeState(value) }} value={registryData?.state} placeholder='State' />
                                    )}
                                />
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='zipCode'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangeZipCode(value) }} value={registryData?.zipCode} placeholder='Zip Code' />
                                    )}
                                />
                            </Grid.Cell>

                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='country'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangeCountry(value) }} value={registryData?.country} placeholder='Country' />
                                    )}
                                />
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='city'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangeCity(value) }} value={registryData?.city} placeholder='City' />
                                    )}
                                />
                            </Grid.Cell>

                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Controller
                                    control={control}
                                    name='phoneNumber'
                                    render={({ field }) => (
                                        <TextField onChange={(value) => { field.onChange(value); handleChangePhone(value) }} value={registryData?.phoneNumber} placeholder='Phone Number' />
                                    )}
                                />
                            </Grid.Cell>
                        </Grid>

                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                <Button submit>Create Registry</Button>
                            </Grid.Cell>
                        </Grid>
                    </FormLayout>
                </Form>}

            <br/><br/><br/>
            <div className='wf-analatic-footer'>
                <Footer myLanguage={myLanguage} />
            </div>
        </div>
    )
}

export default CreateRegistry
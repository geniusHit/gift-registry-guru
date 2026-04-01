import React, { useState, useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Form, FormLayout, Checkbox, TextField, Button, Select, Grid, Popover, DatePicker } from '@shopify/polaris';
import SaveBar from '../../SaveBar';
import useAppMetafield from '../../../hooks/useAppMetafield';
import SkeletonPage1 from '../../SkeletonPage1';
import { SaveBar as NewSaveBar, useAppBridge } from '@shopify/app-bridge-react'

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
    };
    const handleChangeName = (value) => {
        setRegistryData((prev) => ({ ...prev, name: value }))
        showSaveBar()
    }

    useEffect(() => {
        useEffectLite()
    }, [])

    const useEffectLite = async () => {
        setIsLoading(true)
        await getAllAppDataMetafields()
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

    const handleChangeSaveBar = async (shopify) => {
        shopify.saveBar.hide("collection-setting-save-bar");
        const result = await trigger();
        if (result) {
            handleSubmit(saveToMetafield)();
        }
    };

    const handleDiscard = (shopify, id) => {
        shopify.saveBar.hide("collection-setting-save-bar");
    };

    function showSaveBar(shopify) {
        shopify.saveBar.show("collection-setting-save-bar");
    }

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

    const shopify = useAppBridge()
    const pageSaveBarId="collection-setting-save-bar"

    const SaveBar = ({ savebarid, handlechange, handlediscard }) => {
        return (
            <NewSaveBar id={savebarid}>
                <button variant="primary" onClick={handlechange}>Save</button>
                <button onClick={handlediscard}>Discard</button>
            </NewSaveBar>
        )
    }

    return (
        <div>
            {isloading ? <SkeletonPage1 /> :
                <Form onSubmit={handleSubmit(submit)}>
                    <FormLayout>
                        {/* {(saveBar) ? <SaveBar save="Save" /> : ""} */}

                        <SaveBar savebarid={pageSaveBarId} handlechange={() => { handleChangeSaveBar(shopify) }} handlediscard={() => {
                            handleDiscard(shopify)
                        }} />

                        <Controller
                            control={control}
                            name='name'
                            render={({ field }) => (
                                <TextField onChange={(value) => { field.onChange(value); handleChangeName(value) }} value={registryData?.name} placeholder='Enter registry name' />
                            )}
                        />

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
                    </FormLayout>
                </Form>}
        </div>
    )
}

export default CreateRegistry
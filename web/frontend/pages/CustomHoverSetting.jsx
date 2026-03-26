import React from 'react';
import { Text, Card, Grid } from '@shopify/polaris';
import ColorPickerController from '../hooks/useColorPickerController';
import BorderController from '../hooks/useBorderController';

const CustomHoverSetting = ({ aloneIcon, control, setSaveBar, watchAllFields, formName, myLanguage, showLess, onlyTextButton }) => {
    const Css = [
        { value: "px", label: "px" },
        { value: "%", label: "%" },
        { value: "rem", label: "rem" }
    ];

    const datas = [
        { value: "dotted", label: "Dotted" },
        { value: "dashed", label: "Dashed" },
        { value: "solid", label: "Solid" },
        { value: "double", label: "Double" },
        { value: "groove", label: "Groove" },
        { value: "ridge", label: "Ridge" },
        { value: "inset", label: "Inset" },
        { value: "outset", label: "Outset" },
        { value: "hidden", label: "Hidden" },
        { value: "none", label: "None" }
    ];

    return (
        <>
            <Grid>
                {showLess === true ? <></> :
                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                        <div className='endColorPicker'>
                            <Card>
                                <div className='custom-margin'>
                                    <Text variant="headingMd" as="h3">{myLanguage.buttonSetting}</Text>
                                    <p>{myLanguage.buttonSettingSubHeading}</p>
                                </div>

                                <div className={`${onlyTextButton && 'disableOneByOne'}`}>
                                    <ColorPickerController control={control} controllerName={`${formName}hoverBgColor`} id={`${formName}hoverBgColor`} label={myLanguage.styleBackgroundColor} setSaveBar={setSaveBar} />
                                    <BorderController control={control} controllerName={`${formName}hoverBorderInput`} id={`${formName}hoverBorderInput`} controllerBorderUnitName={`${formName}hoverBorderInputUnit`} label={myLanguage.styleBorder} controllerBorderName={`${formName}hoverBorderType`} controllerBorderColor={`${formName}hoverBorderColor`} setSaveBar={setSaveBar} myLanguage={myLanguage} />
                                </div>
                            </Card>
                        </div>
                    </Grid.Cell>}

                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <div className='endColorPicker'>
                        <Card>
                            <div className={`${aloneIcon && 'disableOneByOne'}`}>
                                {/* <RangeController control={control} controllerName={`${formName}hoverFontSize`} id={`${formName}fontSize`} selectControllerName={`${formName}hoverFontSizeUnit`} label={myLanguage.styleFontSize} setSaveBar={setSaveBar} /> */}
                                <div className='custom-margin'>
                                    <Text variant="headingMd" as="h3">{myLanguage.textSetting}</Text>
                                    <p>{myLanguage.textSettingSubHeading}</p>
                                </div>
                                <ColorPickerController control={control} controllerName={`${formName}hoverTextColor`} id={`${formName}hoverTextColor`} label={myLanguage.styleTextColor} setSaveBar={setSaveBar} />
                            </div>
                        </Card>
                    </div>
                </Grid.Cell>
                {formName === "" && <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <div className='endColorPicker'>
                        <Card>
                            <div className='custom-margin'>
                                <Text variant="headingMd" as="h3">{myLanguage.iconSetting}</Text>
                                <p>{myLanguage.iconSettingSubHeading}</p>
                            </div>

                            <ColorPickerController control={control} controllerName={`${formName}hovericonColor`} id={`${formName}hovericonColor`} label={myLanguage.iconColor} setSaveBar={setSaveBar} />
                        </Card>
                    </div>
                </Grid.Cell>
                }
            </Grid>
        </>
    )
}

export default CustomHoverSetting;
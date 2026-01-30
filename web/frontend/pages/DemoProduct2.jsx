import React from 'react';
import { Text, Button, ButtonGroup } from '@shopify/polaris';
import Hoodie from '../assets/rabbit_hoodie.png';

const DemoProducts = ({ watchAllFields, selectedBtn, myLanguage }) => {

    const onlyTextButton = watchAllFields.buttonTypeRadio === "text" || watchAllFields.buttonTypeRadio === "icon-text"
    return (
        <>
            <Text as="h2" variant="headingSm">{myLanguage.previewHeadingText}</Text>
            <img src={Hoodie} alt="Rabbit Hoodie" />
            <Text as="h3" variant="headingXl">{myLanguage.previewProductName}</Text>

            <div className='product-price-priv'>{myLanguage.previewProductPrice} 610.99</div>

            <div className='wf-product-color-varition'>
                <Text as='p' variant='body'>{myLanguage.previewProductColor}</Text>

                <ButtonGroup>
                    <Button size='slim'>{myLanguage.ppcValue1}</Button>
                    <Button size='slim'>{myLanguage.ppcValue2}</Button>
                    <Button size='slim'>{myLanguage.ppcValue3}</Button>
                </ButtonGroup>
            </div>

            <p id='addToCartDemo' className='demoSpans' style={{ marginBottom: "5px" }}><Button>add to cart</Button></p>

            <span className="skeleton-div" style={{ display: "flex" }}>
                {watchAllFields.buttonTypeRadio === "text-button" ? selectedBtn.textButtonFxn() : ""}
                {watchAllFields.buttonTypeRadio === "icon-text-button" ? selectedBtn.iconTextButtonFxn("") : ""}
                {watchAllFields.buttonTypeRadio === "text" ? selectedBtn.textFxn() : ""}
                {watchAllFields.buttonTypeRadio === "icon-text" ? selectedBtn.iconTextFxn("") : ""}
                {watchAllFields.buttonTypeRadio === "icon" ? selectedBtn.iconFxn("") : ""}
                {watchAllFields.showCount !== "no" && !onlyTextButton ? <div id='wf-count-demo'>12</div> : ""}
            </span>
        </>
    )
}

export default DemoProducts;
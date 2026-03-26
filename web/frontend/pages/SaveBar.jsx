import React from 'react'

const SaveBar = ({ save }) => {
    return (
        <div className="header-save"><button type='submit'>{save}</button></div>
    )
}

export default SaveBar


// import React from 'react'
// import { SaveBar as NewSaveBar, useAppBridge } from '@shopify/app-bridge-react'

// const SaveBar = ({ savebarid, handlechange, handlediscard }) => {
//     return (
//         <NewSaveBar id={savebarid}>
//             <button variant="primary" onClick={handlechange}>Save</button>
//             <button onClick={handlediscard}>Discard</button>
//         </NewSaveBar>
//     )
// }

// export default SaveBar
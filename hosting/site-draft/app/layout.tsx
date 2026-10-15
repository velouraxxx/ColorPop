import type {Metadata} from 'next';
import './colorpop/palette.css';
import './colorpop/homepage.css';
import './colorpop/styles.css';
export const metadata:Metadata={title:'ColorPop · Your story starts here',description:'Your private world of characters, stories, and conversations.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

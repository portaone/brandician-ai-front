import React from 'react';

const Footer: React.FC = () => (
    <footer className="bg-[#383236] min-h-[617px] lg:h-[617px] text-white relative">
        <div className="container pt-[40px] md:pt-[50px] lg:pt-[60px] pb-[60px] md:pb-[70px] lg:pb-[80px] px-4 lg:px-0">
            {/* Main content grid */}
            <div className="flex flex-col lg:flex-row">
                <div className="flex flex-col items-center lg:items-start mb-8 lg:mb-0 text-center lg:text-left">
                    {/* Icon and main heading */}
                    <div className="flex justify-center flex-col items-center lg:items-start lg:justify-start">
                        <div
                            className="flex items-center justify-center w-[60px] h-[60px] md:w-[75px] md:h-[75px] lg:w-[90px] lg:h-[90px] bg-[#7f5971] rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 262.27 260.56">
                                <g id="icons">
                                    <path
                                        d="M131.15,197.9a7.53,7.53,0,0,1-5.38-2.3L67,136.84a38.23,38.23,0,0,1-10.08-35.17A37.32,37.32,0,0,1,83.38,74a39.54,39.54,0,0,1,10.19-1.36,37,37,0,0,1,26.48,11.11l11.17,10.73L142.1,83.64a37.62,37.62,0,0,1,53.2,53.2L136.53,195.6A7.53,7.53,0,0,1,131.15,197.9ZM94.91,83a28.32,28.32,0,0,0-28.29,28.28,7.4,7.4,0,0,0,14.8,0A13.5,13.5,0,0,1,94.91,97.81a7.4,7.4,0,1,0,0-14.8Z"
                                        fill="white"/>
                                    <path
                                        d="M93.57,72.77A36.7,36.7,0,0,1,120,83.85l11.24,10.8,10.95-10.94a37.52,37.52,0,0,1,53.06,53.06l-58.77,58.76a7.33,7.33,0,0,1-10.61,0L67.08,136.77a37.89,37.89,0,0,1-10-35.08A37,37,0,0,1,83.41,74.12a39.61,39.61,0,0,1,10.16-1.35M74,118.79a7.5,7.5,0,0,0,7.5-7.5A13.4,13.4,0,0,1,94.91,97.91a7.5,7.5,0,0,0,0-15,28.42,28.42,0,0,0-28.39,28.38,7.5,7.5,0,0,0,7.5,7.5M93.57,72.57v0a39.63,39.63,0,0,0-10.21,1.36,37.43,37.43,0,0,0-26.52,27.72,38.31,38.31,0,0,0,10.1,35.26l58.76,58.76a7.54,7.54,0,0,0,10.9,0l58.77-58.76A37.72,37.72,0,0,0,142,83.57l-10.82,10.8L120.12,83.71A37.09,37.09,0,0,0,93.57,72.57ZM74,118.59a7.3,7.3,0,0,1-7.3-7.3A28.22,28.22,0,0,1,94.91,83.11a7.3,7.3,0,0,1,0,14.6,13.6,13.6,0,0,0-13.59,13.58,7.31,7.31,0,0,1-7.3,7.3Z"
                                        fill="#fff"/>
                                </g>
                            </svg>
                        </div>
                        <h3 className="text-[28px] md:text-[34px] lg:text-[40px] font-['Bitter'] font-normal mt-[15px] md:mt-[18px] lg:mt-[20px] mb-[10px] md:mb-[12px] lg:mb-[15px] leading-[1.25]">
                            Nurturing brands into<br/>
                            legends since 2010
                        </h3>
                        <p className="text-[14px] md:text-[16px] lg:text-[18px] font-['Source_Sans_Pro'] font-medium leading-[1.75] text-[#BFACB8] uppercase tracking-[1.5px] lg:tracking-[2px]">
                            Hearts seek connection—<br/>
                            Archetypes light hidden paths<br/>
                            to brands they cherish
                        </p>
                    </div>
                </div>

                <div className="lg:ml-[140px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:gap-0">
                    <div className="">
                        <div className="mb-6 lg:mb-0">
                            <h4 className="text-[14px] md:text-[16px] lg:text-[18px] font-['Source_Sans_Pro'] font-medium text-[#BFACB8] uppercase tracking-[1.5px] lg:tracking-[2px] leading-[18px] pt-[10px] pb-[8px]">Contact</h4>
                            <ul className="">
                                <li>
                                    <a href="mailto:info@brandician.eu"
                                       className="flex items-center text-[#FD615E] hover:text-white transition-colors duration-300 group">
                                        <svg className="h-[16px] w-[16px] fill-[#7f5971] group-hover:fill-white"
                                             viewBox="0 0 512 512">
                                            <path
                                                d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"/>
                                        </svg>
                                        <span
                                            className="text-base font-['Open_Sans'] text-[14px] md:text-[16px] leading-[1.75em] pl-[8px]">info@brandician.eu</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <h4 className="text-[14px] md:text-[16px] lg:text-[18px] font-['Source_Sans_Pro'] font-medium text-[#BFACB8] uppercase tracking-[1.5px] lg:tracking-[2px] leading-[18px] pt-[10px] pb-[8px]">About</h4>
                        <ul className="">
                            <li>
                                <a href="https://www.brandician.eu"
                                   className="flex items-center text-[#FD615E] hover:text-white transition-colors duration-300 group">
                                    <svg className="h-[16px] w-[16px] fill-[#7f5971] group-hover:fill-white"
                                         viewBox="0 0 512 512">
                                        <path
                                            d="M428.8 137.6h-86.177a115.52 115.52 0 0 0 2.176-22.4c0-47.914-35.072-83.2-92-83.2-45.314 0-57.002 48.537-75.707 78.784-7.735 12.413-16.994 23.317-25.851 33.253l-.131.146-.129.148C135.662 161.807 127.764 168 120.8 168h-2.679c-5.747-4.952-13.536-8-22.12-8H32c-17.673 0-32 12.894-32 28.8v230.4C0 435.106 14.327 448 32 448h64c8.584 0 16.373-3.048 22.12-8h2.679c28.688 0 67.137 40 127.2 40h21.299c62.542 0 98.8-38.658 99.94-91.145 12.482-17.813 18.491-40.785 15.985-62.791A93.148 93.148 0 0 0 393.152 304H428.8c45.435 0 83.2-37.584 83.2-83.2 0-45.099-38.101-83.2-83.2-83.2zm0 118.4h-91.026c12.837 14.669 14.415 42.825-4.95 61.05 11.227 19.646 1.687 45.624-12.925 53.625 6.524 39.128-10.076 61.325-50.6 61.325H248c-45.491 0-77.21-35.913-120-39.676V215.571c25.239-2.964 42.966-21.222 59.075-39.596 11.275-12.65 21.725-25.3 30.799-39.875C232.355 112.712 244.006 80 252.8 80c23.375 0 44 8.8 44 35.2 0 35.2-26.4 53.075-26.4 70.4h158.4c18.425 0 35.2 16.5 35.2 35.2 0 18.975-16.225 35.2-35.2 35.2zM88 384c0 13.255-10.745 24-24 24s-24-10.745-24-24 10.745-24 24-24 24 10.745 24 24z"/>
                                    </svg>
                                    <span
                                        className="text-base font-['Open_Sans'] text-[14px] md:text-[16px] leading-[1.75em] pl-[8px]">About Brandician</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.brandician.eu/about/what-makes-us-different/"
                                   className="flex items-center text-[#FD615E] hover:text-white transition-colors duration-300 group">
                                    <svg className="h-[16px] w-[16px] fill-[#7f5971] group-hover:fill-white"
                                         viewBox="0 0 576 512">
                                        <path
                                            d="M288 144a110.94 110.94 0 0 0-31.24 5 55.4 55.4 0 0 1 7.24 27 56 56 0 0 1-56 56 55.4 55.4 0 0 1-27-7.24A111.71 111.71 0 1 0 288 144zm284.52 97.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400c-98.65 0-189.09-55-237.93-144C98.91 167 189.34 112 288 112s189.09 55 237.93 144C477.1 345 386.66 400 288 400z"/>
                                    </svg>
                                    <span
                                        className="text-base font-['Open_Sans'] text-[14px] md:text-[16px] leading-[1.75em] pl-[8px]">What makes us special</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.brandician.eu/app/"
                                   className="flex items-center text-[#FD615E] hover:text-white transition-colors duration-300 group">
                                    <svg className="h-[16px] w-[16px] fill-[#7f5971] group-hover:fill-white"
                                         viewBox="0 0 496 512">
                                        <path
                                            d="M225.38 233.37c-12.5 12.5-12.5 32.76 0 45.25 12.49 12.5 32.76 12.5 45.25 0 12.5-12.5 12.5-32.76 0-45.25-12.5-12.49-32.76-12.49-45.25 0zM248 8C111.03 8 0 119.03 0 256s111.03 248 248 248 248-111.03 248-248S384.97 8 248 8zm126.14 148.05L308.17 300.4a31.938 31.938 0 0 1-15.77 15.77l-144.34 65.97c-16.65 7.61-33.81-9.55-26.2-26.2l65.98-144.35a31.938 31.938 0 0 1 15.77-15.77l144.34-65.97c16.65-7.6 33.8 9.55 26.19 26.2z"/>
                                    </svg>
                                    <span
                                        className="text-base font-['Open_Sans'] text-[14px] md:text-[16px] leading-[1.75em] pl-[8px]">The App</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.brandician.eu/our-work/"
                                   className="flex items-center text-[#FD615E] hover:text-white transition-colors duration-300 group">
                                    <svg className="h-[16px] w-[16px] fill-[#7f5971] group-hover:fill-white"
                                         viewBox="0 0 512 512">
                                        <path
                                            d="M396.8 352h22.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-192 0h22.4c6.4 0 12.8-6.4 12.8-12.8V140.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h22.4c6.4 0 12.8-6.4 12.8-12.8V204.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zM496 400H48V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16zm-387.2-48h22.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8z"/>
                                    </svg>
                                    <span
                                        className="text-base font-['Open_Sans'] text-[14px] md:text-[16px] leading-[1.75em] pl-[8px]">Our work</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.brandician.eu/blog/"
                                   className="flex items-center text-[#FD615E] hover:text-white transition-colors duration-300 group">
                                    <svg className="h-[16px] w-[16px] fill-[#7f5971] group-hover:fill-white"
                                         viewBox="0 0 576 512">
                                        <path
                                            d="M402.3 344.9l32-32c5-5 13.7-1.5 13.7 5.7V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V112c0-26.5 21.5-48 48-48h273.5c7.1 0 10.7 8.6 5.7 13.7l-32 32c-1.5 1.5-3.5 2.3-5.7 2.3H48v352h352V350.5c0-2.1.8-4.1 2.3-5.6zm156.6-201.8L296.3 405.7l-90.4 10c-26.2 2.9-48.5-19.2-45.6-45.6l10-90.4L432.9 17.1c22.9-22.9 59.9-22.9 82.7 0l43.2 43.2c22.9 22.9 22.9 60 .1 82.8zM460.1 174L402 115.9 216.2 301.8l-7.3 65.3 65.3-7.3L460.1 174zm64.8-79.7l-43.2-43.2c-4.1-4.1-10.8-4.1-14.8 0L436 82l58.1 58.1 30.9-30.9c4-4.2 4-10.8-.1-14.9z"/>
                                    </svg>
                                    <span
                                        className="text-base font-['Open_Sans'] text-[14px] md:text-[16px] leading-[1.75em] pl-[8px]">Blog</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="">
                        <h4 className="text-[14px] md:text-[16px] lg:text-[18px] font-['Source_Sans_Pro'] font-medium text-[#BFACB8] uppercase tracking-[1.5px] lg:tracking-[2px] leading-[18px] pt-[10px] pb-[8px]">Legal</h4>
                        <ul className="">
                            <li>
                                <a href="https://www.brandician.eu/legal/cookie-policy/"
                                   className="flex items-center text-[#FD615E] hover:text-white transition-colors duration-300 group">
                                    <svg className="h-[16px] w-[16px] fill-[#7f5971] group-hover:fill-white"
                                         viewBox="0 0 512 512">
                                        <path
                                            d="M510.52 255.82c-69.97-.85-126.47-57.69-126.47-127.86-70.17 0-127-56.49-127.86-126.45-27.26-4.14-55.13.3-79.72 12.82l-69.13 35.22a132.221 132.221 0 0 0-57.79 57.81l-35.1 68.88a132.645 132.645 0 0 0-12.82 80.95l12.08 76.27a132.521 132.521 0 0 0 37.16 72.96l54.77 54.76a132.036 132.036 0 0 0 72.71 37.06l76.71 12.15c27.51 4.36 55.7-.11 80.53-12.76l69.13-35.21a132.273 132.273 0 0 0 57.79-57.81l35.1-68.88c12.56-24.64 17.01-52.58 12.91-79.91zM176 368c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm32-160c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm160 128c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z"/>
                                    </svg>
                                    <span
                                        className="text-base font-['Open_Sans'] text-[14px] md:text-[16px] leading-[1.75em] pl-[8px]">Cookie policy</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.brandician.eu/legal/privacy-policy/"
                                   className="flex items-center text-[#FD615E] hover:text-white transition-colors duration-300 group">
                                    <svg className="h-[16px] w-[16px] fill-[#7f5971] group-hover:fill-white"
                                         viewBox="0 0 448 512">
                                        <path
                                            d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"/>
                                    </svg>
                                    <span
                                        className="text-base font-['Open_Sans'] text-[14px] md:text-[16px] leading-[1.75em] pl-[8px]">Privacy policy</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.brandician.eu/legal/terms-of-use/"
                                   className="flex items-center text-[#FD615E] hover:text-white transition-colors duration-300 group">
                                    <svg className="h-[16px] w-[16px] fill-[#7f5971] group-hover:fill-white"
                                         viewBox="0 0 512 512">
                                        <path
                                            d="M104 224H24c-13.255 0-24 10.745-24 24v240c0 13.255 10.745 24 24 24h80c13.255 0 24-10.745 24-24V248c0-13.255-10.745-24-24-24zM64 472c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zM384 81.452c0 42.416-25.97 66.208-33.277 94.548h101.723c33.397 0 59.397 27.746 59.553 58.098.084 17.938-7.546 37.249-19.439 49.197l-.11.11c9.836 23.337 8.237 56.037-9.308 79.469 8.681 25.895-.069 57.704-16.382 74.757 4.298 17.598 2.244 32.575-6.148 44.632C440.202 511.587 389.616 512 346.839 512l-2.845-.001c-48.287-.017-87.806-17.598-119.56-31.725-15.957-7.099-36.821-15.887-52.651-16.178-6.54-.12-11.783-5.457-11.783-11.998v-213.77c0-3.2 1.282-6.271 3.558-8.521 39.614-39.144 56.648-80.587 89.117-113.111 14.804-14.832 20.188-37.236 25.393-58.902C282.515 39.293 291.817 0 312 0c24 0 72 8 72 81.452z"/>
                                    </svg>
                                    <span
                                        className="text-base font-['Open_Sans'] text-[14px] md:text-[16px] leading-[1.75em] pl-[8px]">Terms of use</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="justify-center items-center flex flex-col">
                {/* Decorative Divider */}
                <div className="relative w-full max-w-[475px] pt-[30px] md:pt-[36px] lg:pt-[43px]">
                    <div
                        className="h-[13px] w-full"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' overflow='visible' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%237F5971' stroke-width='2' stroke-linecap='square' stroke-miterlimit='10'%3E%3Cpath d='M0,6c6,0,6,13,12,13S18,6,24,6'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'repeat-x',
                            backgroundPosition: 'center',
                            backgroundSize: '24px 100%'
                        }}
                    >
                        <div className="h-full"></div>
                    </div>
                </div>
                {/* Copyright */}
                <div className="text-center mt-[10px]">
                    <p className="text-[10px] md:text-[11px] lg:text-[12px] font-['Source_Sans_Pro'] font-medium uppercase text-[#B38FA5] tracking-[1.5px] lg:tracking-[2px] pb-[15px] px-4 lg:px-0">
                        © 2010–{new Date().getFullYear()} LAJT d.o.o. Ljubljana, Slovenia. All Rights reserved.
                    </p>
                </div>
            </div>
        </div>
        {/* Bottom triangle shape */}
        <div
            className="absolute bottom-[-1px] left-0 w-full flex justify-center overflow-hidden leading-[0] rotate-180">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="340 0 20 10" preserveAspectRatio="none"
                 className="w-[40px] md:w-[48px] lg:w-[58px] h-[15px] md:h-[17px] lg:h-[20px]">
                <path className="fill-[#7f5971]" d="M350,10L340,0h20L350,10z"></path>
            </svg>
        </div>
    </footer>

);

export default Footer; 
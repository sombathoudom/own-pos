import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { get } from "lodash";

import { router } from "@inertiajs/react";

//i18n
import i18n from "../../i18n";
import languages from "../../common/languages";


const LanguageDropdown = () => {
    // Declare a new state variable, which we'll call "menu"
    const [selectedLang, setSelectedLang] = useState("");

    useEffect(() => {
        const currentLanguage: any = localStorage.getItem("I18N_LANGUAGE");
        setSelectedLang(currentLanguage);
    }, []);

    // const changeLanguageAction = (lang: any) => {
    //     //set language as i18n
    //     i18n.changeLanguage(lang);
    //     localStorage.setItem("I18N_LANGUAGE", lang);
    //     setSelectedLang(lang);

    //     // 2) Laravel locale (session/cookie)
    //     router.post(
    //         route("locale.set"),
    //         { locale: lang },
    //         {
    //             preserveScroll: true,
    //             preserveState: true,
    //             onSuccess: () => {
    //                 // Reload current page props so server-side translations/validation messages update
    //                 router.reload({ preserveScroll: true, preserveState: true });
    //             },
    //         }
    //     );
    // };


    const changeLanguageAction = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("I18N_LANGUAGE", lang);
        setSelectedLang(lang);

        router.post(route("locale.set"), { locale: lang }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => router.reload({ preserveScroll: true, preserveState: true }),
        });
    };



    const [isLanguageDropdown, setIsLanguageDropdown] = useState < boolean > (false);
    const toggleLanguageDropdown = () => {
        setIsLanguageDropdown(!isLanguageDropdown);
    };
    return (
        <React.Fragment>
            <Dropdown show={isLanguageDropdown} onClick={toggleLanguageDropdown} className="ms-1  topbar-head-dropdown header-item">
                <Dropdown.Toggle className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle arrow-none" as="button">
                    <img
                        src={get(languages, `${selectedLang}.flag`)}
                        alt="Header Language"
                        height="20"
                        className="rounded"
                    />
                </Dropdown.Toggle>
                <Dropdown.Menu className="notify-item language py-2">
                    {Object.keys(languages).map(key => (
                        <Dropdown.Item
                            key={key}
                            onClick={() => changeLanguageAction(key)}
                            className={`notify-item ${selectedLang === key ? "active" : "none"
                                }`}
                        >
                            <img
                                src={get(languages, `${key}.flag`)}
                                alt="Skote"
                                className="me-2 rounded"
                                height="18"
                            />
                            <span className="align-middle">
                                {get(languages, `${key}.label`)}
                            </span>
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </React.Fragment>
    );
};

export default LanguageDropdown;
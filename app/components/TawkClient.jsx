"use client";

import { useAuth } from "@/app/context/AuthContext";
import Script from "next/script";

const TawkClient = () => {
  const { user } = useAuth();

  return (
    <>
      {user && (
        <Script
          id="tawk-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/6847b7ece50441190fa8bfcc/1itc2ctd5';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
      )}
    </>
  );
};

export default TawkClient;

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import bpayLogo from "../assets/bpay-logo.svg";
import {
  FaCreditCard,
  FaShoppingCart,
  FaWordpress,
  FaChrome,
  FaMoneyBillWave,
  FaDownload,
  FaCodeBranch,
  FaStore,
  FaShopify,
} from "react-icons/fa";
import {
  MdPayment,
  MdSecurityUpdateGood,
  MdOutlineInstallMobile,
  MdInstallDesktop,
  MdCode,
  MdAddToHomeScreen,
} from "react-icons/md";
import {
  SiStripe,
  SiMagento,
  SiWoocommerce,
  SiShopify,
  SiPrestashop,
} from "react-icons/si";

const HomePage = () => {
  // State to track if the app can be installed as PWA
  const [isPwaInstallable, setIsPwaInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Listen for the beforeinstallprompt event to detect PWA installability
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
      // Update state to show install button
      setIsPwaInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  // Function to handle PWA installation
  const handlePwaInstall = () => {
    if (!installPrompt) return;

    // Show the install prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      // Clear the saved prompt as it can't be used again
      setInstallPrompt(null);
      setIsPwaInstallable(false);
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <header className="bg-slate-900 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Checkout Your Way.{" "}
                <span className="text-blue-400">Complete Every Purchase.</span>
              </h1>
              <p className="text-xl mb-8 text-slate-300">
                Empower your wallet. Split payments across your cards, accounts,
                and wallets. Control how you spend, and never abandon a cart
                again.
              </p>
              <div className="space-x-4">
                <Link
                  to="/auth"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Get Started
                </Link>
                <a
                  href="#how-it-works"
                  className="px-6 py-3 rounded-lg font-medium border border-slate-600 hover:border-slate-400 transition"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="bg-blue-600/20 w-64 h-64 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 blur-xl"></div>
                <div className="relative z-10 bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <img
                          src={bpayLogo}
                          alt="bPay Logo"
                          className="h-7 mr-2"
                        />
                      </div>
                    </div>
                    <div className="text-blue-400 font-medium">$120.50</div>
                  </div>
                  <div className="space-y-5 my-6">
                    <div className="flex justify-between items-center p-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <SiStripe className="text-white text-xs" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">Capital One</div>
                          <div className="text-xs text-slate-400">
                            **** 4519
                          </div>
                        </div>
                      </div>
                      <div className="font-medium">$50.00</div>
                    </div>
                    <div className="flex justify-between items-center p-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <SiStripe className="text-white text-xs" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">Chase</div>
                          <div className="text-xs text-slate-400">
                            **** 3352
                          </div>
                        </div>
                      </div>
                      <div className="font-medium">$40.50</div>
                    </div>
                    <div className="flex justify-between items-center p-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <FaMoneyBillWave className="text-white text-xs" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">Gift Card</div>
                          <div className="text-xs text-slate-400">
                            **** 9810
                          </div>
                        </div>
                      </div>
                      <div className="font-medium">$30.00</div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-slate-700">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">Total amount:</div>
                        <div className="text-blue-400 font-semibold">
                          $120.50
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                    Complete Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Integration Options */}
      <section className="py-16 bg-slate-800 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Multiple Integration Options
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Choose the integration that works best for your needs. Our
              platform integrates seamlessly with your existing systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-700 rounded-xl p-8 border border-slate-600 transform transition hover:scale-105">
              <div className="bg-blue-600/20 w-16 h-16 rounded-full mb-6 flex items-center justify-center">
                <FaChrome className="text-blue-400 text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Browser Extension</h3>
              <p className="text-slate-300 mb-6">
                Our browser extension works on any shopping site, automatically
                detecting checkout pages and enabling split payments without any
                merchant integration.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-400 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Automatic payment form detection</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-400 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Unified payment method for seamless checkout</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-400 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    Compatible with every checkout page, without setup
                  </span>
                </li>
              </ul>
              <a
                href="/extension/bpay-extension.zip"
                download
                className="inline-block bg-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <FaDownload className="inline-block mr-2" />
                Download Extension
              </a>
            </div>

            <div className="bg-slate-700 rounded-xl p-8 border border-slate-600 transform transition hover:scale-105">
              <div className="bg-blue-600/20 w-16 h-16 rounded-full mb-6 flex items-center justify-center">
                <FaWordpress className="text-blue-400 text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4">E-Commerce Plugin</h3>
              <p className="text-slate-300 mb-6">
                For eCommerce merchants, our plugin offers a native integration
                that makes split payments available directly in your checkout
                experience.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-400 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Seamless eCommerce integration</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-400 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Customizable checkout experience</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-400 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Full order management and refund support</span>
                </li>
              </ul>
              <a
                href="/getBPay-woocommerce.zip"
                download
                className="inline-block bg-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <FaDownload className="inline-block mr-2" />
                Download WordPress Plugin
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-6">
                <span className="text-blue-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-900">
                Link Payment Methods
              </h3>
              <p className="text-slate-600">
                Connect your credit cards, debit cards, and digital wallets in
                one place.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-6">
                <span className="text-blue-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-900">
                Smart Split
              </h3>
              <p className="text-slate-600">
                Distribute payment amounts across your funding sources based on
                available balances.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-6">
                <span className="text-blue-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-900">
                Instant Checkout
              </h3>
              <p className="text-slate-600">
                Complete your purchase in seconds with our seamless checkout
                process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">
            Problems We Solve
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-slate-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <FaShoppingCart className="text-red-500 text-xl" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  Buyer Frustrations
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-red-500 font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-slate-800">
                      Payment Declined Due to Insufficient Funds
                    </h4>
                    <p className="text-slate-600">
                      Buyers often face the frustration of having enough money
                      across multiple accounts but not enough in any single one
                      to complete a purchase.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-red-500 font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-slate-800">
                      Card Limits and Restrictions
                    </h4>
                    <p className="text-slate-600">
                      Credit card limits, daily spending caps, and foreign
                      transaction restrictions force buyers to abandon purchases
                      they want to make.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-red-500 font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-slate-800">
                      Complex Checkout Process
                    </h4>
                    <p className="text-slate-600">
                      Buyers hate having to start over, switch payment methods,
                      or use multiple transactions to complete a single
                      purchase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <h4 className="font-semibold mb-4 text-blue-600">
                  Our Solution:
                </h4>
                <p className="text-slate-700">
                  bPay lets buyers split payments across multiple cards,
                  accounts and methods in a single checkout, putting them in
                  control and ensuring they can always complete their purchase.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border border-slate-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <MdPayment className="text-blue-500 text-xl" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  Merchant Challenges
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-500 font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-slate-800">
                      Cart Abandonment
                    </h4>
                    <p className="text-slate-600">
                      Nearly 70% of carts are abandoned, with payment issues
                      being a leading cause, resulting in billions in lost
                      revenue annually.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-500 font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-slate-800">
                      Complex Payment Integration
                    </h4>
                    <p className="text-slate-600">
                      Merchants struggle with integrating multiple payment
                      methods and gateways, requiring significant development
                      resources.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-500 font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-slate-800">
                      Lost High-Value Sales
                    </h4>
                    <p className="text-slate-600">
                      Big-ticket items face higher abandonment rates due to
                      payment limits and declined transactions, hurting profit
                      margins.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <h4 className="font-semibold mb-4 text-blue-600">
                  Our Solution:
                </h4>
                <p className="text-slate-700">
                  bPay provides merchants with a single, simple integration that
                  increases conversion rates by enabling flexible payment
                  options without any additional complexity in their checkout
                  flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">
            Key Features
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-2xl font-semibold mb-4 text-slate-900">
                For Buyers
              </h3>
              <p className="text-slate-600 mb-6">
                No more checkout failures due to insufficient funds on a single
                card. With bPay, you're in full control, split your total
                payment between multiple sources. Whether it's your debit card,
                credit card, wallet, or voucher, you choose how much to pay from
                each, seamlessly, instantly, and securely.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Pay the way you want
                </li>
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Stay within personal limits
                </li>
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Finish checkout in just a few clicks
                </li>
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Works with our browser extension on any checkout page
                </li>
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Ability to use one-time cards for secure transactions
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-2xl font-semibold mb-4 text-slate-900">
                For Merchants
              </h3>
              <p className="text-slate-600 mb-6">
                Reduce cart abandonment and increase conversion rates, by
                solving one of the biggest pain points in checkout: Customers
                running into declined payments due to single-method limitations.
                With bPay, shoppers complete the purchase using multiple funding
                sources, but you get paid in one smooth transaction, no extra
                steps, no additional integrations.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Higher checkout success rate
                </li>
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Lower drop-offs at payment stage
                </li>
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  A better experience for your customers
                </li>
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Simple integration using plugins and APIs
                </li>
                <li className="flex items-center text-slate-700">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Single payment settlement on your end
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-8 rounded-lg">
            <h3 className="text-2xl font-semibold mb-6 text-center text-slate-900">
              The bPay Experience
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdPayment className="text-blue-600 text-xl" />
                </div>
                <p className="text-slate-700 font-medium">
                  Split any payment however you want
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCreditCard className="text-blue-600 text-xl" />
                </div>
                <p className="text-slate-700 font-medium">
                  Customize how much each method pays
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaShoppingCart className="text-blue-600 text-xl" />
                </div>
                <p className="text-slate-700 font-medium">
                  No waiting, no switching tabs, just checkout and go
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdSecurityUpdateGood className="text-blue-600 text-xl" />
                </div>
                <p className="text-slate-700 font-medium">
                  Full control. Total flexibility. Real freedom at checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PWA Installation Prompt */}
      {isPwaInstallable && (
        <section className="py-10 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-6 md:mb-0">
                <MdAddToHomeScreen className="text-3xl mr-4" />
                <div>
                  <h3 className="text-xl font-bold">Install bPay App</h3>
                  <p className="text-sm md:text-base">
                    Get faster access and a better experience
                  </p>
                </div>
              </div>
              <button
                onClick={handlePwaInstall}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-slate-100 transition flex items-center"
              >
                <MdInstallDesktop className="mr-2" /> Install App
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Install Extension Banner */}
      <section className="py-8 bg-slate-100">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="bg-blue-100 p-4 rounded-full mr-6">
                <FaChrome className="text-3xl text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Get the bPay Browser Extension
                </h3>
                <p className="text-slate-600 max-w-xl">
                  Split payments on any shopping site with our easy-to-install
                  browser extension. No merchant integration needed!
                </p>
              </div>
            </div>
            <a
              href="#"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition whitespace-nowrap flex items-center"
            >
              <FaDownload className="mr-2" /> Add to Browser
            </a>
          </div>
        </div>
      </section>

      {/* Merchant Integration */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-6 text-slate-900">
            Integration Options for Merchants
          </h2>
          <p className="text-xl text-center mb-16 text-slate-600 max-w-3xl mx-auto">
            Choose the integration method that worksbest for your business. We
            offer multiple ways to incorporate bPay into your checkout flow.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* E-commerce Platform Plugins */}
            <div className="bg-slate-50 rounded-xl shadow-md overflow-hidden transition hover:shadow-lg">
              <div className="h-3 bg-blue-600"></div>
              <div className="p-6">
                <div className="w-14 h-14 bg-blue-100 rounded-lg mb-6 flex items-center justify-center">
                  <FaStore className="text-2xl text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">
                  E-commerce Plugins
                </h3>
                <p className="text-slate-600 mb-6">
                  Ready-to-use plugins for popular e-commerce platforms. Simple
                  installation with no coding required.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center">
                    <SiWoocommerce className="text-purple-600 mr-2" /> Woo
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center">
                    <SiShopify className="text-green-600 mr-2" /> Shopify
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center">
                    <SiMagento className="text-orange-600 mr-2" /> Magento
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center">
                    <SiPrestashop className="text-blue-600 mr-2" /> PrestaShop
                  </div>
                </div>
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-800 transition flex items-center"
                >
                  Browse Plugins{" "}
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* API Integration */}
            <div className="bg-slate-50 rounded-xl shadow-md overflow-hidden transition hover:shadow-lg">
              <div className="h-3 bg-green-600"></div>
              <div className="p-6">
                <div className="w-14 h-14 bg-green-100 rounded-lg mb-6 flex items-center justify-center">
                  <MdCode className="text-2xl text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">
                  API Integration
                </h3>
                <p className="text-slate-600 mb-6">
                  Comprehensive REST API with extensive documentation. Perfect
                  for custom checkout implementations.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-700">RESTful endpoints</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-700">Webhook support</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-700">
                      SDK in multiple languages
                    </span>
                  </div>
                </div>
                <a
                  href="#"
                  className="text-green-600 font-medium hover:text-green-800 transition flex items-center"
                >
                  API Documentation{" "}
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Developer Platform */}
            <div className="bg-slate-50 rounded-xl shadow-md overflow-hidden transition hover:shadow-lg">
              <div className="h-3 bg-purple-600"></div>
              <div className="p-6">
                <div className="w-14 h-14 bg-purple-100 rounded-lg mb-6 flex items-center justify-center">
                  <FaCodeBranch className="text-2xl text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">
                  Developer Platform
                </h3>
                <p className="text-slate-600 mb-6">
                  Complete toolkit for developers including sample code,
                  libraries, and testing tools.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-700">Sandbox environment</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-700">
                      Code samples & libraries
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-700">Technical support</span>
                  </div>
                </div>
                <a
                  href="#"
                  className="text-purple-600 font-medium hover:text-purple-800 transition flex items-center"
                >
                  Developer Portal{" "}
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a
              href="#"
              className="inline-block bg-slate-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-700 transition"
            >
              Merchant Documentation
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Ready to transform your checkout experience?
          </h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            Join thousands of shoppers and merchants who have revolutionized
            their payment experience with bPay.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/auth"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-slate-100 transition"
            >
              Create an Account
            </Link>
            <a
              href="#"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition"
            >
              For Merchants
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center mb-2">
                <img src={bpayLogo} alt="bPay Logo" className="h-8 mr-2" />
              </div>
              <p className="text-slate-400">
                Smart split payments for seamless checkout.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-white mb-2">Downloads</h4>
              <div className="flex flex-col space-y-2">
                <a 
                  href="/extension/bpay-extension.zip" 
                  download 
                  className="text-slate-400 hover:text-white flex items-center"
                >
                  <FaChrome className="mr-2" /> Chrome Extension
                </a>
                <a 
                  href="/getBPay-woocommerce.zip" 
                  download 
                  className="text-slate-400 hover:text-white flex items-center"
                >
                  <FaWordpress className="mr-2" /> WordPress Plugin
                </a>
              </div>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-slate-400 hover:text-white">
                Terms
              </a>
              <a href="#" className="text-slate-400 hover:text-white">
                Privacy
              </a>
              <a href="#" className="text-slate-400 hover:text-white">
                Support
              </a>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            &copy; {new Date().getFullYear()} bPay. All rights reserved. |{" "}
            <a href="https://bosstsc.com" className="hover:text-white">
              B Ventures LLC
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

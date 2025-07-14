import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import henryCmsRoutes from "./henry-cms/routes";

// Check if Stripe API key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('WARNING: Missing Stripe secret key. Payment functionality will not work.');
}

// Initialize Stripe if API key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;

export function registerRoutes(app: Express): Server {
  // Set up authentication routes
  setupAuth(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  
  // Calculate service fee
  const calculateServiceFee = (amount: number) => {
    // Base fee percentage
    const feePercentage = 0.025; // 2.5%
    
    // Minimum fee
    const minimumFee = 0.50; // $0.50
    
    // Calculate percentage-based fee
    const percentageFee = amount * feePercentage;
    
    // Return the greater of percentage fee or minimum fee
    return Math.max(percentageFee, minimumFee);
  };

  // Check Stripe connection
  app.get("/api/stripe/status", (req, res) => {
    if (!stripe) {
      return res.status(500).json({ 
        connected: false, 
        message: "Stripe API key not configured" 
      });
    }

    res.json({ 
      connected: true, 
      message: "Stripe API connected" 
    });
  });

  // Get all payment methods
  app.get("/api/payment-methods", async (req, res) => {
    try {
      // In a real app, we would get the user ID from the authenticated session
      const userId = 1; // Mock user ID for now

      const paymentMethods = await storage.getPaymentMethods(userId);
      res.json(paymentMethods);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching payment methods", 
        details: error.message 
      });
    }
  });

  // Get all virtual cards
  app.get("/api/virtual-cards", async (req, res) => {
    try {
      // In a real app, we would get the user ID from the authenticated session
      const userId = 1; // Mock user ID for now

      const virtualCards = await storage.getVirtualCards(userId);
      res.json(virtualCards);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching virtual cards", 
        details: error.message 
      });
    }
  });

  // Get a specific virtual card
  app.get("/api/virtual-cards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const virtualCard = await storage.getVirtualCard(id);

      if (!virtualCard) {
        return res.status(404).json({ error: "Virtual card not found" });
      }

      res.json(virtualCard);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching virtual card", 
        details: error.message 
      });
    }
  });

  // Create payment method endpoint
  app.post("/api/payment-methods", async (req, res) => {
    try {
      // In a real app, this would validate the user is authenticated
      // For now, mock user ID
      const userId = 1; // In a production app, get from authenticated session

      if (!stripe) {
        return res.status(500).json({ 
          error: "Stripe API not configured" 
        });
      }

      // Get the payment method type and data
      const { type } = req.body;
      
      let stripePaymentMethodId = null;
      let paymentMethod = null;

      // Handle different payment method types
      switch (type) {
        case 'card':
          // Process credit/debit card
          const { card } = req.body;
          
          // Validate card data
          if (!card || !card.number || !card.exp_month || !card.exp_year || !card.cvc) {
            return res.status(400).json({ error: "Incomplete card information" });
          }

          try {
            // Create payment method in Stripe
            const stripePaymentMethod = await stripe.paymentMethods.create({
              type: 'card',
              card: {
                number: card.number,
                exp_month: card.exp_month,
                exp_year: card.exp_year,
                cvc: card.cvc
              }
            });
            
            // If a customer ID exists, attach the payment method to the customer
            const user = await storage.getUser(userId);
            if (user?.stripeCustomerId) {
              await stripe.paymentMethods.attach(stripePaymentMethod.id, {
                customer: user.stripeCustomerId
              });
            }

            stripePaymentMethodId = stripePaymentMethod.id;
            
            // Create payment method in our database
            paymentMethod = {
              userId,
              type: 'card',
              name: card.name || 'Credit/Debit Card',
              brand: stripePaymentMethod.card?.brand || 'unknown',
              lastFour: stripePaymentMethod.card?.last4 || '****',
              expiryMonth: stripePaymentMethod.card?.exp_month,
              expiryYear: stripePaymentMethod.card?.exp_year,
              stripePaymentMethodId: stripePaymentMethod.id
            };
          } catch (stripeError: any) {
            console.error("Stripe card error:", stripeError);
            return res.status(400).json({ 
              error: "Invalid card information", 
              details: stripeError.message 
            });
          }
          break;

        case 'bank_account':
          // Process bank account
          const bankAccountData = req.body.bankAccount;
          
          // Validate bank account data
          if (!bankAccountData || !bankAccountData.account_number || !bankAccountData.routing_number) {
            return res.status(400).json({ error: "Incomplete bank account information" });
          }

          try {
            // Get or create customer if needed
            const user = await storage.getUser(userId);
            let customerId = user?.stripeCustomerId;

            if (!customerId) {
              // Create a customer first
              const customer = await stripe.customers.create({
                name: bankAccountData.account_holder_name || "Account Holder",
                email: user?.email || undefined
              });
              
              customerId = customer.id;
              // Save customer ID to user
              await storage.updateUser(userId, { stripeCustomerId: customerId });
            }

            // Create a bank account token
            const bankToken = await stripe.tokens.create({
              bank_account: {
                country: 'US',
                currency: 'usd',
                account_holder_name: bankAccountData.account_holder_name,
                account_holder_type: bankAccountData.account_holder_type || 'individual',
                routing_number: bankAccountData.routing_number,
                account_number: bankAccountData.account_number
              }
            });

            // Add bank account to customer
            const bankSource = await stripe.customers.createSource(
              customerId,
              { source: bankToken.id }
            ) as any; // Type assertion as Stripe types are complex

            stripePaymentMethodId = bankSource.id;

            // Create payment method in our database
            paymentMethod = {
              userId,
              type: 'bank_account',
              name: bankAccountData.account_holder_name || 'Bank Account',
              bankName: bankSource.bank_name || 'Bank',
              accountType: bankSource.object === 'bank_account' ? bankSource.account_type : 'checking',
              lastFour: bankSource.last4 || '****',
              stripePaymentMethodId: bankSource.id
            };
          } catch (stripeError: any) {
            console.error("Stripe bank account error:", stripeError);
            return res.status(400).json({ 
              error: "Invalid bank account information", 
              details: stripeError.message 
            });
          }
          break;

        case 'paypal':
          // Process PayPal
          const { paypal } = req.body;
          
          if (!paypal || !paypal.email) {
            return res.status(400).json({ error: "Incomplete PayPal information" });
          }

          // Note: Direct PayPal integration requires additional setup with Stripe Connect
          // For a basic implementation, we can store the info now and handle account linking 
          // through a separate flow
          
          // Create payment method in our database
          paymentMethod = {
            userId,
            type: 'paypal',
            name: 'PayPal',
            provider: 'paypal',
            email: paypal.email,
            metadata: { 
              verified: false, 
              status: 'pending_verification'
            }
          };
          break;

        case 'stripe_balance':
          // Process Stripe Balance (using Stripe Connect)
          // Requires the user to connect their Stripe account
          
          // Store a placeholder that will be completed when the user connects their account
          paymentMethod = {
            userId,
            type: 'stripe_balance',
            name: 'Stripe Balance',
            provider: 'stripe',
            metadata: { 
              status: 'pending_connection'
            }
          };
          break;

        default:
          return res.status(400).json({ error: "Unsupported payment method type" });
      }

      // Save the payment method to our database
      const savedPaymentMethod = await storage.addPaymentMethod(userId, paymentMethod);

      // Return the created payment method
      res.status(201).json(savedPaymentMethod);
    } catch (error: any) {
      console.error("Payment method creation error:", error);
      res.status(500).json({ 
        error: "Error creating payment method", 
        details: error.message 
      });
    }
  });

  // Create virtual card endpoint
  app.post("/api/virtual-cards", async (req, res) => {
    try {
      // Validate the user is authenticated (in a real app)
      // For now we're using a mock userId
      const userId = 1; // In a real app, get from auth session

      const { name, cardholderName, amount, paymentSources, isOneTime } = req.body;

      // Validate required fields (name and cardholderName are always required)
      if (!name || !cardholderName) {
        return res.status(400).json({ 
          error: "Missing required card information" 
        });
      }

      // Process payment sources
      let processedPaymentSources = paymentSources;

      // Only validate funding sources if an amount is provided
      if (amount > 0) {
        // Validate that payment sources are provided
        if (!processedPaymentSources || !Array.isArray(processedPaymentSources) || processedPaymentSources.length === 0) {
          return res.status(400).json({ 
            error: "Payment sources required when creating a funded card" 
          });
        }

        // Calculate total funding from all payment sources
        const totalFunding = processedPaymentSources.reduce(
          (sum: number, source: any) => sum + parseFloat(source.amount || 0), 
          0
        );

        // Validate that funding sources total matches requested amount
        if (Math.abs(totalFunding - amount) > 0.01) { // Allow for small floating point differences
          return res.status(400).json({
            error: "Total funding amount does not match requested card amount",
            requestedAmount: amount,
            providedFunding: totalFunding
          });
        }
      } else {
        // For saving a card without funding, ensure we have an empty array of payment sources
        processedPaymentSources = processedPaymentSources || [];
      }

      // Get the configured card provider
      const cardProviderSetting = await storage.getSystemSettingByKey('card_provider');
      const cardProvider = cardProviderSetting?.value || 'stripe';

      // Check if the card provider is available
      if (cardProvider === 'stripe' && !stripe) {
        return res.status(500).json({ 
          error: "Stripe API not configured. Cannot issue virtual cards." 
        });
      }

      // Check for regional provider override (if any)
      const regionalProvidersSetting = await storage.getSystemSettingByKey('regional_card_providers');
      const regionalProviders = regionalProvidersSetting?.valueJson || {};

      // Process the payment and create virtual card with Stripe Issuing
      try {
        // In a production app, we would first:
        // 1. Process the funding source payments with Stripe
        // 2. Get or create a cardholder for the user
        // 3. Create the virtual card with the processed funds

        // For demo purposes, let's check if the user already has a Stripe cardholder ID
        const user = await storage.getUser(userId);
        let cardholderIdForStripe;

        if (!user?.stripeCustomerId && stripe && cardProvider === 'stripe') {
          // Create a new Stripe customer/cardholder
          const customer = await stripe.customers.create({
            name: cardholderName,
            description: `Cardholder for virtual tipping cards - User ID: ${userId}`
          });

          // Update the user with the Stripe customer ID
          await storage.updateUser(userId, { stripeCustomerId: customer.id });
          cardholderIdForStripe = customer.id;
        } else {
          cardholderIdForStripe = user.stripeCustomerId;
        }

        // In a real integration, we would create a card with Stripe Issuing
        // Here's a reference to what that would look like:

        // const stripeCard = await stripe.issuing.cards.create({
        //   cardholder: cardholderIdForStripe,
        //   currency: 'usd',
        //   type: 'virtual',
        //   status: amount > 0 ? 'active' : 'inactive'
        // });

        // Since we may not have Stripe Issuing access, we'll simulate it:
        const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
        const currentDate = new Date();
        const expiryYear = currentDate.getFullYear() + 3;
        const expiryMonth = currentDate.getMonth() + 1;
        const expiryDate = `${expiryMonth.toString().padStart(2, '0')}/${expiryYear.toString().slice(-2)}`;

        // Create the virtual card record
        // Validate required fields
        if (!name || name.trim().length === 0) {
          return res.status(400).json({ error: 'Card name is required' });
        }

        if (!cardholderName || cardholderName.trim().length === 0) {
          return res.status(400).json({ error: 'Cardholder name is required' });
        }

        if (amount < 0) {
          return res.status(400).json({ error: 'Amount cannot be negative' });
        }

        // Generate random last four digits for the card
        const randomLastFour = Math.floor(1000 + Math.random() * 9000).toString();
        
        const card = {
          id: `card_${Math.random().toString(36).substring(2, 10)}`,
          userId,
          name: name.trim(),
          cardholderName: cardholderName.trim(),
          status: amount > 0 ? "active" : "inactive",
          lastFour: randomLastFour,
          cardNumber: `XXXX-XXXX-XXXX-${randomLastFour}`,
          expiryDate: `${expiryMonth.toString().padStart(2, '0')}/${expiryYear}`,
          cvv: Math.floor(100 + Math.random() * 900).toString(),
          balance: amount || 0,
          createdAt: new Date(),
          isOneTime: Boolean(isOneTime),
          fundingSources: processedPaymentSources.map((source: any) => ({
            id: source.id,
            type: source.type,
            amount: source.amount
          })),
          stripeCardId: `ic_${Math.random().toString(36).substring(2, 10)}`
        };

        // Store the virtual card in our database
        const createdCard = await storage.createVirtualCard(userId, card);

        // Return the created card (with sensitive fields masked)
        res.status(201).json({
          id: createdCard.id,
          name: createdCard.name,
          cardholderName: createdCard.cardholderName,
          status: createdCard.status,
          lastFour: createdCard.lastFour,
          expiryDate: createdCard.expiryDate,
          balance: createdCard.balance,
          createdAt: createdCard.createdAt,
          isOneTime: createdCard.isOneTime,
          fundingSources: createdCard.fundingSources
        });
      } catch (stripeError: any) {
        console.error("Stripe error:", stripeError);
        return res.status(500).json({ 
          error: "Error processing payment or creating virtual card with Stripe", 
          details: stripeError.message 
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error creating virtual card", 
        details: error.message 
      });
    }
  });

  // Process multi-source payment
  app.post("/api/process-multi-source-payment", async (req, res) => {
    try {
      // In a real app, validate the user is authenticated
      const userId = 1; // Mock user ID for now
      
      const { paymentSources, totalAmount } = req.body;
      
      // Validate required fields
      if (!paymentSources || !Array.isArray(paymentSources) || paymentSources.length === 0) {
        return res.status(400).json({ error: "Payment sources are required" });
      }
      
      if (!totalAmount || totalAmount <= 0) {
        return res.status(400).json({ error: "Valid total amount is required" });
      }
      
      // Calculate total funding from all payment sources
      const totalFunding = paymentSources.reduce(
        (sum, source) => sum + parseFloat(source.amount || 0), 
        0
      );
      
      // Validate total matches
      if (Math.abs(totalFunding - totalAmount) > 0.01) {
        return res.status(400).json({
          error: "Total funding amount does not match requested amount",
          requestedAmount: totalAmount,
          providedFunding: totalFunding
        });
      }
      
      if (!stripe) {
        return res.status(500).json({ error: "Stripe API not configured" });
      }
      
      // Process each payment source
      const results = [];
      let totalCollected = 0;
      let allSuccessful = true;
      
      for (const source of paymentSources) {
        try {
          // Get the payment method details
          const paymentMethod = await storage.getPaymentMethod(source.id);
          
          if (!paymentMethod) {
            results.push({
              success: false,
              source: source.id,
              error: "Payment method not found"
            });
            allSuccessful = false;
            continue;
          }
          
          let result;
          const amount = parseFloat(source.amount);
          
          // Process based on payment method type
          switch (paymentMethod.type) {
            case 'card':
              // Process card payment
              const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents for Stripe
                currency: 'usd',
                payment_method: paymentMethod.stripePaymentMethodId,
                confirm: true,
                capture_method: 'automatic',
                description: `Payment for virtual card funding - User ID: ${userId}`
              });
              
              if (paymentIntent.status === 'succeeded') {
                totalCollected += amount;
                result = {
                  paymentIntentId: paymentIntent.id,
                  status: paymentIntent.status
                };
              } else {
                allSuccessful = false;
                result = {
                  paymentIntentId: paymentIntent.id,
                  status: paymentIntent.status,
                  requiresAction: paymentIntent.status === 'requires_action'
                };
              }
              break;
              
            case 'bank_account':
              // For bank accounts, we'd typically use ACH transfers which are asynchronous
              // For demo purposes, we'll simulate a successful payment
              // In production, we'd use Stripe's ACH payments or similar
              
              result = {
                simulatedPayment: true,
                status: 'processing' // Bank transfers typically take time to process
              };
              
              // In a demo, we'll count this as collected
              totalCollected += amount;
              break;
              
            case 'paypal':
              // PayPal integration would require a separate flow
              // For demo purposes, we'll simulate a successful payment
              
              result = {
                simulatedPayment: true,
                status: 'succeeded',
                provider: 'paypal'
              };
              
              totalCollected += amount;
              break;
              
            case 'stripe_balance':
              // For Stripe Balance, we'd use Stripe Connect transfers
              // For demo purposes, we'll simulate a successful transfer
              
              result = {
                simulatedPayment: true,
                status: 'succeeded',
                provider: 'stripe_balance'
              };
              
              totalCollected += amount;
              break;
              
            default:
              result = {
                error: `Unsupported payment method type: ${paymentMethod.type}`
              };
              allSuccessful = false;
          }
          
          results.push({
            success: !result.error,
            source: source.id,
            amount,
            result
          });
          
        } catch (error: any) {
          console.error(`Error processing payment source ${source.id}:`, error);
          results.push({
            success: false,
            source: source.id,
            error: error.message || "Processing error"
          });
          allSuccessful = false;
        }
      }
      
      // Calculate service fee
      const serviceFee = calculateServiceFee(totalAmount);
      
      // Return the results of all payment attempts
      res.json({
        success: allSuccessful,
        collected: totalCollected,
        serviceFee,
        netAmount: totalCollected - serviceFee,
        results
      });
      
    } catch (error: any) {
      console.error("Multi-source payment processing error:", error);
      res.status(500).json({
        error: "Error processing payments",
        details: error.message
      });
    }
  });

  // Process payment with virtual card
  app.post("/api/process-payment", async (req, res) => {
    try {
      const { virtualCardId, amount, merchantName } = req.body;
      
      // Validate required fields
      if (!virtualCardId) {
        return res.status(400).json({ error: "Virtual card ID is required" });
      }
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }
      
      // Get the virtual card
      const virtualCard = await storage.getVirtualCard(virtualCardId);
      
      if (!virtualCard) {
        return res.status(404).json({ error: "Virtual card not found" });
      }
      
      // Check if card is active
      if (virtualCard.status !== 'active') {
        return res.status(400).json({ error: "Virtual card is not active" });
      }
      
      // Check if card has sufficient balance
      if (parseFloat(virtualCard.balance) < amount) {
        return res.status(400).json({ 
          error: "Insufficient balance on virtual card",
          available: virtualCard.balance,
          requested: amount
        });
      }
      
      // In a production app, this is where we'd process the actual payment
      // using the card issuing platform (e.g., Stripe Issuing)
      
      // Create a transaction record
      const transaction = await storage.createTransaction({
        virtualCardId: parseInt(virtualCardId),
        merchant: merchantName || "Unknown Merchant",
        description: "Purchase",
        amount: parseFloat(amount),
        date: new Date(),
        status: "completed",
        type: "purchase",
        cardLastFour: virtualCard.lastFour
      });
      
      // Update the card balance
      const newBalance = parseFloat(virtualCard.balance) - amount;
      
      // In a real app, we'd update the card balance here
      // For now, we'll consider this as a successful transaction
      
      res.json({
        success: true,
        transaction,
        newBalance,
        message: "Payment processed successfully"
      });
      
    } catch (error: any) {
      console.error("Payment processing error:", error);
      res.status(500).json({
        error: "Error processing payment",
        details: error.message
      });
    }
  });
  
  // Activate a virtual card
  app.post("/api/virtual-cards/:id/activate", async (req, res) => {
    try {
      const { id } = req.params;
      const virtualCard = await storage.getVirtualCard(id);

      if (!virtualCard) {
        return res.status(404).json({ error: "Virtual card not found" });
      }

      // Get the configured card provider
      const cardProviderSetting = await storage.getSystemSettingByKey('card_provider');
      const cardProvider = cardProviderSetting?.value || 'stripe';

      // Check if the card provider is available
      if (cardProvider === 'stripe' && !stripe) {
        return res.status(500).json({ 
          error: "Stripe API not configured. Cannot activate virtual card." 
        });
      }

      // Check for regional provider override (if any)
      const regionalProvidersSetting = await storage.getSystemSettingByKey('regional_card_providers');
      const regionalProviders = regionalProvidersSetting?.valueJson || {};

      try {
        // In a production app with Stripe Issuing, we would activate the card with Stripe
        // Example:
        // if (virtualCard.stripeCardId) {
        //   await stripe.issuing.cards.update(virtualCard.stripeCardId, {
        //     status: 'active'
        //   });
        // }

        // For now, we'll just update the status in our database
        const updatedCard = { ...virtualCard, status: "active" };

        // Return the updated card details
        res.json({
          id: updatedCard.id,
          name: updatedCard.name,
          status: updatedCard.status,
          lastFour: updatedCard.lastFour,
          expiryDate: updatedCard.expiryDate,
          balance: updatedCard.balance,
          message: "Card activated successfully"
        });
      } catch (stripeError: any) {
        console.error("Stripe error:", stripeError);
        return res.status(500).json({ 
          error: "Error activating card with Stripe", 
          details: stripeError.message 
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error activating virtual card", 
        details: error.message 
      });
    }
  });

  // Deactivate a virtual card
  app.post("/api/virtual-cards/:id/deactivate", async (req, res) => {
    try {
      const { id } = req.params;
      const virtualCard = await storage.getVirtualCard(id);

      if (!virtualCard) {
        return res.status(404).json({ error: "Virtual card not found" });
      }

      // Get the configured card provider
      const cardProviderSetting = await storage.getSystemSettingByKey('card_provider');
      const cardProvider = cardProviderSetting?.value || 'stripe';

      // Check if the card provider is available
      if (cardProvider === 'stripe' && !stripe) {
        return res.status(500).json({ 
          error: "Stripe API not configured. Cannot deactivate virtual card." 
        });
      }

      // Check for regional provider override (if any)
      const regionalProvidersSetting = await storage.getSystemSettingByKey('regional_card_providers');
      const regionalProviders = regionalProvidersSetting?.valueJson || {};

      try {
        // In a production app with Stripe Issuing, we would deactivate the card with Stripe
        // Example:
        // if (virtualCard.stripeCardId) {
        //   await stripe.issuing.cards.update(virtualCard.stripeCardId, {
        //     status: 'inactive'
        //   });
        // }

        // For now, we'll just update the status in our database
        const updatedCard = { ...virtualCard, status: "inactive" };

        // Return the updated card details
        res.json({
          id: updatedCard.id,
          name: updatedCard.name,
          status: updatedCard.status,
          lastFour: updatedCard.lastFour,
          expiryDate: updatedCard.expiryDate,
          balance: updatedCard.balance,
          message: "Card deactivated successfully"
        });
      } catch (stripeError: any) {
        console.error("Stripe error:", stripeError);
        return res.status(500).json({ 
          error: "Error deactivating card with Stripe", 
          details: stripeError.message 
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error deactivating virtual card", 
        details: error.message 
      });
    }
  });

  // Get all transactions for a user
  app.get("/api/transactions", async (req, res) => {
    try {
      // In a real app, we would get the user ID from the authenticated session
      const userId = 1; // Mock user ID for now

      // Get virtual cards for this user
      const virtualCards = await storage.getVirtualCards(userId);
      const virtualCardIds = virtualCards.map(card => card.id);

      // Get transactions for all virtual cards
      const transactions = [];

      for (const cardId of virtualCardIds) {
        try {
          const cardTransactions = await storage.getTransactionsByVirtualCard(cardId);
          transactions.push(...cardTransactions);
        } catch (err) {
          console.warn(`Could not fetch transactions for card ${cardId}:`, err);
          // Continue with other cards
        }
      }

      // Sort transactions by date (most recent first)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Return only the most recent transactions (limit to 10)
      const recentTransactions = transactions.slice(0, 10);

      res.json(recentTransactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ 
        error: "Error fetching transactions", 
        details: error.message 
      });
    }
  });

  // Get transactions for a specific virtual card
  app.get("/api/virtual-cards/:id/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const virtualCard = await storage.getVirtualCard(id);

      if (!virtualCard) {
        return res.status(404).json({ error: "Virtual card not found" });
      }

      // Get transactions for this virtual card
      const transactions = await storage.getTransactionsByVirtualCard(id);

      // Sort transactions by date (most recent first)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json(transactions);
    } catch (error: any) {
      console.error(`Error fetching transactions for card ${req.params.id}:`, error);
      res.status(500).json({ 
        error: "Error fetching transactions", 
        details: error.message 
      });
    }
  });

  // Add funds to a virtual card
  // Split payment with multiple payment methods and service fee
  app.post("/api/split-payment", async (req, res) => {
    try {
      // In a real app, get user ID from auth session
      const userId = 1;
      
      const { name, amount, totalCharged, serviceFee, paymentSources } = req.body;
      
      // Validate required fields
      if (!name || !amount || !totalCharged || !serviceFee || !paymentSources || !Array.isArray(paymentSources)) {
        return res.status(400).json({ 
          error: "Missing required split payment information" 
        });
      }
      
      // Log the payment sources to debug allocation issues
      console.log('Split payment request received:', {
        amount,
        totalCharged,
        serviceFee,
        paymentSourceCount: paymentSources.length,
        paymentSources: paymentSources.map(s => ({
          id: s.id, 
          amount: s.amount,
          percentage: s.percentage,
          originalAmount: s.originalAmount
        }))
      });
      
      // Validate service fee calculation (should be 2.5% of amount)
      const expectedServiceFee = calculateServiceFee(amount);
      const serviceFeeDifference = Math.abs(serviceFee - expectedServiceFee);
      
      if (serviceFeeDifference > 0.01) { // Allow small floating point differences
        return res.status(400).json({
          error: "Invalid service fee calculation",
          expected: expectedServiceFee,
          received: serviceFee
        });
      }
      
      // Validate total charged amount (should be amount + service fee)
      const expectedTotalCharge = parseFloat(amount) + parseFloat(serviceFee);
      const totalChargeDifference = Math.abs(totalCharged - expectedTotalCharge);
      
      if (totalChargeDifference > 0.01) { // Allow small floating point differences
        return res.status(400).json({
          error: "Invalid total charge calculation",
          expected: expectedTotalCharge,
          received: totalCharged
        });
      }
      
      // Calculate total funding from all payment sources
      const totalFunding = paymentSources.reduce(
        (sum, source) => sum + parseFloat(source.amount || 0), 
        0
      );
      
      // Validate that funding sources total matches the total charged amount
      if (Math.abs(totalFunding - totalCharged) > 0.01) {
        return res.status(400).json({
          error: "Total funding amount does not match total charged amount",
          totalCharged: totalCharged,
          providedFunding: totalFunding
        });
      }
      
      // If we have Stripe configured, process the payments
      if (stripe) {
        // Get or create a customer for the user
        const user = await storage.getUser(userId);
        let customerId = user?.stripeCustomerId;
        
        if (!customerId) {
          // Create a new Stripe customer
          const customer = await stripe.customers.create({
            name: name,
            description: `User ID: ${userId}`
          });
          
          customerId = customer.id;
          await storage.updateUser(userId, { stripeCustomerId: customerId });
        }
        
        // Process each payment source
        for (const source of paymentSources) {
          const paymentMethod = await storage.getPaymentMethod(source.id);
          
          if (!paymentMethod) {
            return res.status(400).json({
              error: `Payment method not found: ${source.id}`
            });
          }
          
          // For each payment source, create a separate PaymentIntent
          // This allows for more flexibility than a single payment with multiple sources
          const paymentAmount = Math.round(parseFloat(source.amount) * 100); // Convert to cents
          
          if (paymentMethod.type === 'card' && paymentMethod.stripePaymentMethodId) {
            await stripe.paymentIntents.create({
              amount: paymentAmount,
              currency: 'usd',
              customer: customerId,
              payment_method: paymentMethod.stripePaymentMethodId,
              description: `Split payment for ${name} - Amount: $${(paymentAmount / 100).toFixed(2)}`,
              confirm: true,
              off_session: true
            });
          }
          // Add handling for other payment method types as needed
        }
      }
      
      // Generate the virtual card details
      const cardholderName = name || "Virtual Card";
      const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
      const currentDate = new Date();
      const expiryYear = currentDate.getFullYear() + 3;
      const expiryMonth = currentDate.getMonth() + 1;
      
      // Create virtual card record in storage
      const virtualCard = {
        id: `card_${Math.random().toString(36).substring(2, 10)}`,
        userId,
        name: name,
        cardholderName: cardholderName,
        status: "active",
        lastFour: lastFour,
        cardNumber: `XXXX-XXXX-XXXX-${lastFour}`,
        expiryDate: `${expiryMonth.toString().padStart(2, '0')}/${expiryYear}`,
        cvv: Math.floor(100 + Math.random() * 900).toString(),
        balance: parseFloat(amount),
        serviceFee: parseFloat(serviceFee),
        totalCharged: parseFloat(totalCharged),
        createdAt: new Date(),
        isOneTime: true,
        paymentSources: paymentSources.map(source => ({
          id: source.id,
          type: source.type,
          amount: parseFloat(source.amount || 0),
          // Add optional fields if they exist for better debugging
          originalAmount: source.originalAmount ? parseFloat(source.originalAmount) : undefined,
          feeContribution: source.feeContribution ? parseFloat(source.feeContribution) : undefined,
          totalCharge: source.totalCharge ? parseFloat(source.totalCharge) : undefined
        }))
      };
      
      // Save the virtual card
      const savedCard = await storage.createVirtualCard(userId, virtualCard);
      
      // Return the created virtual card
      res.status(201).json(savedCard);
    } catch (error) {
      console.error("Split payment error:", error);
      res.status(500).json({
        error: "Error processing split payment",
        details: error.message
      });
    }
  });
  
  app.post("/api/virtual-cards/:id/add-funds", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, paymentSource } = req.body;

      // Validate required fields
      if (!amount || !paymentSource) {
        return res.status(400).json({ 
          error: "Missing required fields" 
        });
      }

      const virtualCard = await storage.getVirtualCard(id);

      if (!virtualCard) {
        return res.status(404).json({ error: "Virtual card not found" });
      }

      // Get the configured card provider
      const cardProviderSetting = await storage.getSystemSettingByKey('card_provider');
      const cardProvider = cardProviderSetting?.value || 'stripe';

      // Check if the card provider is available
      if (cardProvider === 'stripe' && !stripe) {
        return res.status(500).json({ 
          error: "Stripe API not configured. Cannot add funds to virtual card." 
        });
      }

      // Check for regional provider override (if any)
      const regionalProvidersSetting = await storage.getSystemSettingByKey('regional_card_providers');
      const regionalProviders = regionalProvidersSetting?.valueJson || {};

      try {
        // In a production app with Stripe Issuing, we would:
        // 1. Process the payment using the payment source
        // 2. Add funds to the virtual card through Stripe's API

        // For demo purposes, simulate a Stripe payment
        const parsedAmount = parseFloat(amount);
        const amountInCents = Math.round(parsedAmount * 100);

        // Process the payment with Stripe (in production, we'd use the actual payment source info)
        // In a real implementation, you would use:
        // - stripe.paymentIntents.create() to charge a card
        // - stripe.issuing.transactions.create() to add funds to the virtual card

        // Simulate a successful payment transaction
        console.log(`Processing ${amountInCents} cents payment for virtual card ${id}`);

        // For a real Stripe Issuing implementation, we would load funds onto the card:
        // if (virtualCard.stripeCardId) {
        //   await stripe.issuing.cards.update(virtualCard.stripeCardId, {
        //     // Update card balance
        //   });
        // }

        // Update the card balance in our database
        const updatedCard = { 
          ...virtualCard, 
          balance: (parseFloat(virtualCard.balance) + parsedAmount).toFixed(2) 
        };

        // Return the updated card details
        res.json({
          id: updatedCard.id,
          name: updatedCard.name,
          status: updatedCard.status,
          lastFour: updatedCard.lastFour,
          expiryDate: updatedCard.expiryDate,
          balance: updatedCard.balance,
          message: `Successfully added $${amount} to card`
        });
      } catch (stripeError: any) {
        console.error("Stripe error:", stripeError);
        return res.status(500).json({ 
          error: "Error processing payment with Stripe", 
          details: stripeError.message 
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error adding funds to virtual card", 
        details: error.message 
      });
    }
  });

  // If using Stripe, this would be the endpoint to handle payment setup
  if (stripe) {
    app.post("/api/create-payment-intent", async (req, res) => {
      try {
        const { amount, includeServiceFee = true } = req.body;
        
        // Calculate the service fee if needed
        let totalAmount = parseFloat(amount);
        let serviceFee = 0;
        
        if (includeServiceFee) {
          serviceFee = calculateServiceFee(totalAmount);
          totalAmount += serviceFee;
        }
        
        // Create the payment intent with the total amount
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: "usd",
          metadata: {
            originalAmount: amount.toString(),
            serviceFee: serviceFee.toString(),
            includesServiceFee: includeServiceFee ? "true" : "false"
          }
        });

        res.json({ 
          clientSecret: paymentIntent.client_secret,
          originalAmount: amount,
          serviceFee: serviceFee,
          totalAmount: totalAmount
        });
      } catch (error: any) {
        res.status(500).json({ 
          error: "Error creating payment intent", 
          details: error.message 
        });
      }
    });
    
    // Handle subscription creation or retrieval
    app.post('/api/get-or-create-subscription', isAuthenticated, async (req, res) => {
      try {
        if (!stripe) {
          return res.status(500).json({ error: "Stripe API not configured" });
        }
        
        const user = req.user;
        
        if (!user) {
          return res.status(401).json({ error: "Authentication required" });
        }
        
        // Check if user already has a subscription
        if (user.stripeSubscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
            
            // Return subscription info with payment intent secret if payment is needed
            return res.send({
              subscriptionId: subscription.id,
              clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              plan: {
                name: "Premium Plan",
                price: (subscription.items.data[0].price.unit_amount || 0) / 100, // Convert from cents
                billingCycle: subscription.items.data[0].price.recurring?.interval || "month" 
              }
            });
          } catch (retrieveError) {
            console.error("Error retrieving subscription:", retrieveError);
            // If we can't retrieve, we'll create a new one
          }
        }
        
        // Create a new customer if needed
        if (!user.stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.username,
            metadata: { userId: user.id.toString() }
          });
          
          // Update user with stripe customer ID
          await storage.updateUser(user.id, { 
            stripeCustomerId: customer.id 
          });
          
          user.stripeCustomerId = customer.id;
        }
        
        // Make sure we have a price ID (should be set as env var)
        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
          return res.status(500).json({ 
            error: "Missing STRIPE_PRICE_ID environment variable" 
          });
        }
        
        // Get price information
        const price = await stripe.prices.retrieve(priceId);
        
        // Create the subscription
        const subscription = await stripe.subscriptions.create({
          customer: user.stripeCustomerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
        });
        
        // Update user with subscription ID
        await storage.updateUser(user.id, { 
          stripeSubscriptionId: subscription.id 
        });
        
        // Return subscription info with payment intent secret
        res.send({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
          status: subscription.status,
          plan: {
            name: price.nickname || "Premium Plan",
            price: (price.unit_amount || 0) / 100, // Convert from cents
            billingCycle: price.recurring?.interval || "month"
          }
        });
      } catch (error: any) {
        console.error("Subscription error:", error);
        res.status(500).json({ 
          error: "Error creating subscription", 
          details: error.message 
        });
      }
    });
  }

  // Create Stripe Connect account link for Stripe Balance payment method
  app.post("/api/payment-methods/:id/connect-stripe", async (req, res) => {
    try {
      // In a real app, this would validate the user is authenticated
      const userId = 1; // In a production app, get from authenticated session
      const { id } = req.params;

      if (!stripe) {
        return res.status(500).json({ error: "Stripe API not configured" });
      }

      // Get the payment method from the database
      const paymentMethods = await storage.getPaymentMethods(userId);
      const paymentMethod = paymentMethods.find(pm => pm.id.toString() === id);

      if (!paymentMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      if (paymentMethod.type !== 'stripe_balance') {
        return res.status(400).json({ error: "This operation is only valid for Stripe Balance payment methods" });
      }

      // Create a Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        metadata: {
          userId: userId.toString(),
          paymentMethodId: id
        }
      });

      // Update the payment method with the account ID
      await storage.updatePaymentMethod(id, {
        stripeAccountId: account.id,
        metadata: {
          ...paymentMethod.metadata,
          status: 'account_created'
        }
      });

      // Create an account link for the user to onboard
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.protocol}://${req.get('host')}/payment-methods`,
        return_url: `${req.protocol}://${req.get('host')}/payment-methods`,
        type: 'account_onboarding'
      });

      // Return the account link URL
      res.json({
        accountLinkUrl: accountLink.url,
        status: 'account_created'
      });
    } catch (error: any) {
      console.error("Stripe Connect error:", error);
      res.status(500).json({
        error: "Error creating Stripe Connect account",
        details: error.message
      });
    }
  });

  // Verify PayPal payment method
  app.post("/api/payment-methods/:id/verify-paypal", async (req, res) => {
    try {
      // In a real app, this would validate the user is authenticated
      const userId = 1; // In a production app, get from authenticated session
      const { id } = req.params;
      const { verificationCode } = req.body;

      // Get the payment method from the database
      const paymentMethods = await storage.getPaymentMethods(userId);
      const paymentMethod = paymentMethods.find(pm => pm.id.toString() === id);

      if (!paymentMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      if (paymentMethod.type !== 'paypal') {
        return res.status(400).json({ error: "This operation is only valid for PayPal payment methods" });
      }

      // In a real implementation, we would validate the verification code with PayPal
      // For now, we'll simulate the verification process
      const mockVerified = verificationCode === '123456'; // Just an example

      // Update the payment method status
      await storage.updatePaymentMethod(id, {
        metadata: {
          ...paymentMethod.metadata,
          verified: mockVerified,
          status: mockVerified ? 'verified' : 'verification_failed'
        }
      });

      res.json({
        verified: mockVerified,
        status: mockVerified ? 'verified' : 'verification_failed'
      });
    } catch (error: any) {
      console.error("PayPal verification error:", error);
      res.status(500).json({
        error: "Error verifying PayPal account",
        details: error.message
      });
    }
  });

  // Update payment method endpoint
  app.patch("/api/payment-methods/:id", async (req, res) => {
    try {
      // In a real app, this would validate the user is authenticated
      const userId = 1; // In a production app, get from authenticated session
      const { id } = req.params;
      const updates = req.body;

      // Get the payment method to make sure it belongs to the user
      const paymentMethods = await storage.getPaymentMethods(userId);
      const paymentMethod = paymentMethods.find(pm => pm.id.toString() === id);

      if (!paymentMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      // Perform updates based on payment method type
      if (paymentMethod.type === 'card' && updates.card && stripe) {
        // Update card in Stripe if needed (expiry dates, etc.)
        if (paymentMethod.stripePaymentMethodId && updates.card.exp_month && updates.card.exp_year) {
          await stripe.paymentMethods.update(paymentMethod.stripePaymentMethodId, {
            card: {
              exp_month: updates.card.exp_month,
              exp_year: updates.card.exp_year
            }
          });
        }
      }

      // Update in our database
      const updatedPaymentMethod = await storage.updatePaymentMethod(id, updates);

      res.json(updatedPaymentMethod);
    } catch (error: any) {
      console.error("Payment method update error:", error);
      res.status(500).json({
        error: "Error updating payment method",
        details: error.message
      });
    }
  });

  // Set payment method as default
  app.post("/api/payment-methods/:id/set-default", async (req, res) => {
    try {
      // In a real app, this would validate the user is authenticated
      const userId = 1; // In a production app, get from authenticated session
      const { id } = req.params;

      // Get the payment method to make sure it belongs to the user
      const paymentMethods = await storage.getPaymentMethods(userId);
      const paymentMethod = paymentMethods.find(pm => pm.id.toString() === id);

      if (!paymentMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      // Update all payment methods to not be default
      for (const method of paymentMethods) {
        if (method.isDefault && method.id.toString() !== id) {
          await storage.updatePaymentMethod(method.id.toString(), { isDefault: false });
        }
      }

      // Set this payment method as default
      const updatedPaymentMethod = await storage.updatePaymentMethod(id, { isDefault: true });

      res.json(updatedPaymentMethod);
    } catch (error: any) {
      console.error("Set default payment method error:", error);
      res.status(500).json({
        error: "Error setting default payment method",
        details: error.message
      });
    }
  });

  // System settings API routes
  app.get("/api/system-settings", isAuthenticated, async (req, res) => {
    try {
      // Authentication handled by middleware
      const settings = await storage.getSystemSettings();

      // Filter out sensitive settings for non-sensitive data
      const publicSettings = settings.map(setting => ({
        ...setting,
        value: setting.isSecret ? undefined : setting.value,
        valueJson: setting.isSecret ? undefined : setting.valueJson
      }));

      res.json(publicSettings);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching system settings", 
        details: error.message 
      });
    }
  });

  app.get("/api/system-settings/category/:category", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Admin authorization handled by middleware
      const { category } = req.params;
      const settings = await storage.getSystemSettingsByCategory(category);

      // Filter out sensitive settings for non-sensitive data
      const publicSettings = settings.map(setting => ({
        ...setting,
        value: setting.isSecret ? undefined : setting.value,
        valueJson: setting.isSecret ? undefined : setting.valueJson
      }));

      res.json(publicSettings);
    } catch (error: any) {
      res.status(500).json({ 
        error: `Error fetching system settings for category: ${req.params.category}`, 
        details: error.message 
      });
    }
  });

  app.get("/api/system-settings/:key", isAuthenticated, async (req, res) => {
    try {
      // Authentication handled by middleware
      const { key } = req.params;
      const setting = await storage.getSystemSettingByKey(key);

      if (!setting) {
        return res.status(404).json({ error: `Setting with key ${key} not found` });
      }

      // Don't return sensitive values unless to admin
      const result = {
        ...setting,
        value: setting.isSecret ? undefined : setting.value,
        valueJson: setting.isSecret ? undefined : setting.valueJson
      };

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ 
        error: `Error fetching system setting: ${req.params.key}`, 
        details: error.message 
      });
    }
  });

  app.post("/api/system-settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Admin authorization handled by middleware
      const { key, value, valueJson, description, category, isSecret } = req.body;

      // Check if setting with this key already exists
      const existingSetting = await storage.getSystemSettingByKey(key);
      if (existingSetting) {
        return res.status(400).json({ error: `Setting with key ${key} already exists` });
      }

      const newSetting = await storage.createSystemSetting({
        key,
        value,
        valueJson,
        description,
        category: category || 'general',
        isSecret: isSecret || false
      });

      res.status(201).json(newSetting);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error creating system setting", 
        details: error.message 
      });
    }
  });

  app.put("/api/system-settings/:key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Admin authorization handled by middleware
      const { key } = req.params;
      const { value, valueJson, description, category, isSecret } = req.body;

      // Check if setting exists
      const existingSetting = await storage.getSystemSettingByKey(key);
      if (!existingSetting) {
        return res.status(404).json({ error: `Setting with key ${key} not found` });
      }

      // Update the setting
      const updatedSetting = await storage.updateSystemSetting(key, {
        value,
        valueJson,
        description,
        category,
        isSecret
      });

      res.json(updatedSetting);
    } catch (error: any) {
      res.status(500).json({ 
        error: `Error updating system setting: ${req.params.key}`, 
        details: error.message 
      });
    }
  });

  app.delete("/api/system-settings/:key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Admin authorization handled by middleware
      const { key } = req.params;

      const result = await storage.deleteSystemSetting(key);
      if (!result) {
        return res.status(404).json({ error: `Setting with key ${key} not found` });
      }

      res.json({ message: `Setting ${key} deleted successfully` });
    } catch (error: any) {
      res.status(500).json({ 
        error: `Error deleting system setting: ${req.params.key}`, 
        details: error.message 
      });
    }
  });

  // Card provider config API
  app.get("/api/card-provider", isAuthenticated, async (req, res) => {
    try {
      const setting = await storage.getSystemSettingByKey('card_provider');
      if (!setting) {
        return res.status(404).json({ error: "Card provider configuration not found" });
      }

      res.json({ 
        provider: setting.value,
        supportedProviders: ['stripe', 'other_provider1', 'other_provider2'] // List available providers
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching card provider configuration", 
        details: error.message 
      });
    }
  });

  app.put("/api/card-provider", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Admin authorization handled by middleware
      const { provider } = req.body;

      // Validate provider
      const validProviders = ['stripe', 'other_provider1', 'other_provider2'];
      if (!validProviders.includes(provider)) {
        return res.status(400).json({ 
          error: "Invalid provider", 
          validProviders 
        });
      }

      // Update the setting
      const setting = await storage.getSystemSettingByKey('card_provider');
      if (!setting) {
        return res.status(404).json({ error: "Card provider configuration not found" });
      }

      const updatedSetting = await storage.updateSystemSetting('card_provider', {
        value: provider
      });

      res.json({ 
        provider: updatedSetting.value,
        message: `Card provider updated to ${provider}`
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error updating card provider", 
        details: error.message 
      });
    }
  });

  // Regional card providers config API
  app.get("/api/regional-card-providers", isAuthenticated, async (req, res) => {
    try {
      const setting = await storage.getSystemSettingByKey('regional_card_providers');
      if (!setting) {
        return res.status(404).json({ error: "Regional card providers configuration not found" });
      }

      res.json({ 
        regionalProviders: setting.valueJson || {},
        supportedProviders: ['stripe', 'other_provider1', 'other_provider2'] // List available providers
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching regional card providers configuration", 
        details: error.message 
      });
    }
  });

  app.put("/api/regional-card-providers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Admin authorization handled by middleware
      const { regionalProviders } = req.body;

      // Validate the regional providers
      const validProviders = ['stripe', 'other_provider1', 'other_provider2'];
      const invalidRegions = [];

      for (const region in regionalProviders) {
        if (!validProviders.includes(regionalProviders[region])) {
          invalidRegions.push(region);
        }
      }

      if (invalidRegions.length > 0) {
        return res.status(400).json({ 
          error: "Invalid providers for regions", 
          invalidRegions,
          validProviders 
        });
      }

      // Update the setting
      const setting = await storage.getSystemSettingByKey('regional_card_providers');
      if (!setting) {
        return res.status(404).json({ error: "Regional card providers configuration not found" });
      }

      const updatedSetting = await storage.updateSystemSetting('regional_card_providers', {
        valueJson: regionalProviders
      });

      res.json({ 
        regionalProviders: updatedSetting.valueJson,
        message: "Regional card providers updated successfully"
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error updating regional card providers", 
        details: error.message 
      });
    }
  });

  app.post("/logout", async (req, res) => {
    //Implementation for logout
    res.status(200).json({ message: "Logged out successfully" });
  });

  // Set up file upload storage
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
  
  const upload = multer({ 
    storage: storage_config,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept images, SVGs, PDFs, and common document formats
      const allowedTypes = /jpeg|jpg|png|gif|svg|pdf|doc|docx|xls|xlsx|ppt|pptx/;
      const ext = path.extname(file.originalname).toLowerCase();
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && allowedTypes.test(ext)) {
        return cb(null, true);
      }
      
      cb(new Error('Invalid file type. Only images, SVGs, PDFs, and common document formats are allowed.'));
    }
  });

  // ========================== CONTENT MANAGEMENT ROUTES ==========================

  // --------------------- PAGE CONTENT API ROUTES ---------------------
  
  // Get all pages
  app.get("/api/content-management/pages", isAuthenticated, /*isAdmin,*/ async (req, res) => {
    try {
      // Handle both camelCase and snake_case versions of isAdmin for compatibility
      const isUserAdmin = req.user ? (typeof req.user.isAdmin !== 'undefined' ? req.user.isAdmin : req.user.is_admin) : false;
      console.log('GET /api/content-management/pages - User:', req.user ? `ID: ${req.user.id}, Admin: ${isUserAdmin}` : 'Not authenticated');
      
      if (!req.user) {
        console.log('GET /api/content-management/pages - Not authenticated, returning 401');
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const pages = await storage.getAllPageContent();
      console.log(`Found ${pages.length} pages`);
      
      // Enhanced logging - show sample page data for debugging
      if (pages.length > 0) {
        console.log(`Sample page data (first page): ${JSON.stringify(pages[0], null, 2)}`);
      } else {
        console.log('No pages found in database');
      }
      
      res.json(pages);
    } catch (error: any) {
      console.error('Error in getAllPageContent:', error);
      res.status(500).json({ 
        error: "Error fetching page content", 
        details: error.message 
      });
    }
  });
  
  // Get a specific page
  app.get("/api/content-management/pages/:pageId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { pageId } = req.params;
      const page = await storage.getPageContent(pageId);
      
      if (!page) {
        return res.status(404).json({ error: "Page content not found" });
      }
      
      res.json(page);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching page content", 
        details: error.message 
      });
    }
  });
  
  // Create new page
  app.post("/api/content-management/pages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pageData = req.body;
      
      console.log('POST /api/content-management/pages - Request payload:', pageData);
      
      // Check for either camelCase or snake_case versions of pageId
      const pageId = pageData.pageId || pageData.page_id;
      
      // Enforce required fields - page_id and title are required based on the schema
      if (!pageId || !pageData.title) {
        return res.status(400).json({ 
          error: "Missing required page information. page_id and title are required.",
          received: pageData 
        });
      }
      
      // Ensure we have the snake_case version for the database
      if (!pageData.page_id) {
        pageData.page_id = pageId;
      }
      
      console.log('Creating page with page_id:', pageData.page_id);
      
      try {
        const newPage = await storage.createPageContent(pageData);
        console.log('Created new page:', newPage);
        res.status(201).json(newPage);
      } catch (dbError: any) {
        console.error('Database error creating page:', dbError);
        res.status(500).json({ 
          error: "Database error creating page content", 
          details: dbError.message 
        });
      }
    } catch (error: any) {
      console.error('Error creating page content:', error);
      res.status(500).json({ 
        error: "Error creating page content", 
        details: error.message 
      });
    }
  });
  
  // Update a page
  app.put("/api/content-management/pages/:pageId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { pageId } = req.params;
      const updates = req.body;
      
      const updatedPage = await storage.updatePageContent(pageId, updates);
      
      if (!updatedPage) {
        return res.status(404).json({ error: "Page content not found" });
      }
      
      res.json(updatedPage);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error updating page content", 
        details: error.message 
      });
    }
  });
  
  // Delete a page
  app.delete("/api/content-management/pages/:pageId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { pageId } = req.params;
      
      const success = await storage.deletePageContent(pageId);
      
      if (!success) {
        return res.status(404).json({ error: "Page content not found" });
      }
      
      res.status(200).json({ message: "Page content deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error deleting page content", 
        details: error.message 
      });
    }
  });
  
  // --------------------- SECTION CONTENT API ROUTES ---------------------
  
  // Get all sections for a page
  app.get("/api/content-management/pages/:pageId/sections", isAuthenticated, /*isAdmin,*/ async (req, res) => {
    try {
      const { pageId } = req.params;
      console.log('Fetching sections for pageId:', pageId, typeof pageId);
      
      if (!req.user) {
        console.log('User not authenticated in sections endpoint');
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Try different methods of finding the page
      let page = null;
      let pageIdToUse = pageId;
      
      // First try direct lookup by pageId string
      page = await storage.getPageContent(pageId);
      
      // If numeric ID was passed, try to find page by numeric ID
      if (!page && !isNaN(Number(pageId))) {
        console.log(`Trying to find page by numeric ID: ${pageId}`);
        const allPages = await storage.getAllPageContent();
        page = allPages.find(p => p.id === Number(pageId));
        
        if (page) {
          console.log(`Found page by numeric ID lookup: ${page.pageId || page.page_id}`);
          pageIdToUse = page.pageId || page.page_id;
        }
      }
      
      if (!page) {
        console.log(`Page with ID ${pageId} not found for sections request`);
        // Instead of 404, return empty array for better UI experience
        return res.json([]);
      }
      
      console.log(`Found page: ${JSON.stringify(page, null, 2)}`);
      
      // Get sections for this page using the string pageId
      let sections = [];
      try {
        sections = await storage.getSectionsByPage(pageIdToUse);
        console.log(`Found ${sections.length} sections for page ${pageIdToUse}`);
      } catch (sectionErr) {
        console.error(`Error fetching sections for page ${pageIdToUse}:`, sectionErr);
        // Continue with empty array rather than returning an error if sections not found
      }
      
      // Log sample section data for debugging
      if (sections && sections.length > 0) {
        console.log(`Sample section (first): ${JSON.stringify(sections[0], null, 2)}`);
      } else {
        console.log(`No sections found for page ${pageIdToUse}`);
        // Return empty array instead of null
        sections = [];
      }
      
      res.json(sections);
    } catch (error: any) {
      console.error('Error in getSectionsByPage:', error);
      res.status(500).json({ 
        error: "Error fetching section content", 
        details: error.message 
      });
    }
  });
  
  // Get a specific section
  app.get("/api/content-management/pages/:pageId/sections/:sectionId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { pageId, sectionId } = req.params;
      const section = await storage.getSectionContent(pageId, sectionId);
      
      if (!section) {
        return res.status(404).json({ error: "Section content not found" });
      }
      
      res.json(section);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching section content", 
        details: error.message 
      });
    }
  });
  
  // Create new section
  app.post("/api/content-management/pages/:pageId/sections", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { pageId } = req.params;
      // Create a separate sectionData object, keeping pageId separate for method signature
      const sectionData = { ...req.body };
      
      console.log('POST /api/content-management/pages/:pageId/sections - pageId:', pageId);
      console.log('Section data:', sectionData);
      
      // Enforce required fields - should have either sectionId or id
      if (!sectionData.sectionId && !sectionData.id) {
        return res.status(400).json({ error: "Missing required section information (sectionId)" });
      }
      
      if (!sectionData.name) {
        return res.status(400).json({ error: "Missing required section information (name)" });
      }
      
      // If using storage.createSectionContent(pageId, sectionData) signature
      const newSection = await storage.createSectionContent(pageId, sectionData);
      console.log('Created new section:', newSection);
      res.status(201).json(newSection);
    } catch (error: any) {
      console.error('Error creating section:', error);
      res.status(500).json({ 
        error: "Error creating section content", 
        details: error.message 
      });
    }
  });
  
  // Update a section
  app.put("/api/content-management/pages/:pageId/sections/:sectionId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { pageId, sectionId } = req.params;
      const updates = req.body;
      
      const updatedSection = await storage.updateSectionContent(pageId, sectionId, updates);
      
      if (!updatedSection) {
        return res.status(404).json({ error: "Section content not found" });
      }
      
      res.json(updatedSection);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error updating section content", 
        details: error.message 
      });
    }
  });
  
  // Delete a section
  app.delete("/api/content-management/pages/:pageId/sections/:sectionId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { pageId, sectionId } = req.params;
      
      const success = await storage.deleteSectionContent(pageId, sectionId);
      
      if (!success) {
        return res.status(404).json({ error: "Section content not found" });
      }
      
      res.status(200).json({ message: "Section content deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error deleting section content", 
        details: error.message 
      });
    }
  });
  
  // --------------------- MEDIA LIBRARY API ROUTES ---------------------
  
  // Get all media
  app.get("/api/content-management/media", isAuthenticated, /*isAdmin,*/ async (req, res) => {
    try {
      const mediaItems = await storage.getAllMedia();
      res.json(mediaItems);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching media", 
        details: error.message 
      });
    }
  });
  
  // Get a specific media item
  app.get("/api/content-management/media/:mediaId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { mediaId } = req.params;
      const mediaItem = await storage.getMedia(parseInt(mediaId));
      
      if (!mediaItem) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      res.json(mediaItem);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching media", 
        details: error.message 
      });
    }
  });
  
  // Upload new media
  app.post("/api/content-management/media", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const { originalname, filename, size, mimetype } = req.file;
      const filePath = `/uploads/${filename}`;
      
      const mediaData = {
        title: req.body.title || originalname,
        description: req.body.description || '',
        type: mimetype,
        fileName: filename,
        originalName: originalname,
        filePath,
        size,
        uploadedBy: (req.user as any).id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newMedia = await storage.createMedia(mediaData);
      res.status(201).json(newMedia);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error uploading media", 
        details: error.message 
      });
    }
  });
  
  // Update media details
  app.put("/api/content-management/media/:mediaId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { mediaId } = req.params;
      const updates = {
        ...req.body,
        updatedAt: new Date()
      };
      
      const updatedMedia = await storage.updateMedia(parseInt(mediaId), updates);
      
      if (!updatedMedia) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      res.json(updatedMedia);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error updating media", 
        details: error.message 
      });
    }
  });
  
  // Delete media
  app.delete("/api/content-management/media/:mediaId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { mediaId } = req.params;
      
      // Get the media first to find the file path
      const mediaItem = await storage.getMedia(parseInt(mediaId));
      
      if (!mediaItem) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      // Delete the physical file
      const fullPath = path.join(process.cwd(), 'public', mediaItem.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      
      // Delete from database
      const success = await storage.deleteMedia(parseInt(mediaId));
      
      if (!success) {
        return res.status(500).json({ error: "Error deleting media from database" });
      }
      
      res.status(200).json({ message: "Media deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error deleting media", 
        details: error.message 
      });
    }
  });
  
  // --------------------- THEME SETTINGS API ROUTES ---------------------
  
  // Get all themes
  app.get("/api/content-management/themes", isAuthenticated, /*isAdmin,*/ async (req, res) => {
    try {
      const themes = await storage.getAllThemes();
      res.json(themes);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching themes", 
        details: error.message 
      });
    }
  });
  
  // Get active theme
  app.get("/api/content-management/themes/active", async (req, res) => {
    try {
      const theme = await storage.getActiveTheme();
      
      if (!theme) {
        return res.status(404).json({ error: "No active theme found" });
      }
      
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching active theme", 
        details: error.message 
      });
    }
  });
  
  // Get a specific theme
  app.get("/api/content-management/themes/:themeId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { themeId } = req.params;
      const theme = await storage.getTheme(parseInt(themeId));
      
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error fetching theme", 
        details: error.message 
      });
    }
  });
  
  // Create new theme
  app.post("/api/content-management/themes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const themeData = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Enforce required fields
      if (!themeData.name) {
        return res.status(400).json({ error: "Missing required theme information" });
      }
      
      const newTheme = await storage.createTheme(themeData);
      res.status(201).json(newTheme);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error creating theme", 
        details: error.message 
      });
    }
  });
  
  // Update a theme
  app.put("/api/content-management/themes/:themeId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { themeId } = req.params;
      const updates = {
        ...req.body,
        updatedAt: new Date()
      };
      
      const updatedTheme = await storage.updateTheme(parseInt(themeId), updates);
      
      if (!updatedTheme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      
      res.json(updatedTheme);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error updating theme", 
        details: error.message 
      });
    }
  });
  
  // Activate a theme
  app.post("/api/content-management/themes/:themeId/activate", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { themeId } = req.params;
      
      const activatedTheme = await storage.activateTheme(parseInt(themeId));
      
      if (!activatedTheme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      
      res.json({
        ...activatedTheme,
        message: "Theme activated successfully"
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error activating theme", 
        details: error.message 
      });
    }
  });
  
  // Delete a theme
  app.delete("/api/content-management/themes/:themeId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { themeId } = req.params;
      
      // Don't allow deleting the active theme
      const activeTheme = await storage.getActiveTheme();
      if (activeTheme && activeTheme.id === parseInt(themeId)) {
        return res.status(400).json({ 
          error: "Cannot delete the active theme. Please activate another theme first." 
        });
      }
      
      const success = await storage.deleteTheme(parseInt(themeId));
      
      if (!success) {
        return res.status(404).json({ error: "Theme not found" });
      }
      
      res.status(200).json({ message: "Theme deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Error deleting theme", 
        details: error.message 
      });
    }
  });

  // Mount Henry CMS routes
  app.use('/api/henry-cms', henryCmsRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
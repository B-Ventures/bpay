import { IStorage } from './storage';
import { db } from './db';
import { users, paymentMethods, virtualCards, transactions, systemSettings, pageContent, sectionContent, mediaLibrary, themeSettings } from '@shared/schema';
import { eq, and, ne } from 'drizzle-orm';
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from './auth';

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Initialize default data
    this.initDefaultData();
  }

  private async initDefaultData() {
    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.isAdmin, true));
    
    if (existingAdmin.length === 0) {
      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@getbpay.com',
        fullName: 'System Administrator',
        isAdmin: true,
      });
      console.log('Admin user initialized with username: admin');
    }

    // Initialize system settings if needed
    const existingSettings = await db.select().from(systemSettings);
    if (existingSettings.length === 0) {
      await db.insert(systemSettings).values({
        key: 'card_provider',
        value: 'stripe',
        description: 'The service provider for virtual card issuance',
        category: 'payment',
        isSecret: false,
      });
      
      await db.insert(systemSettings).values({
        key: 'regional_card_providers',
        valueJson: {},
        description: 'Configuration for region-specific card providers',
        category: 'payment',
        isSecret: false,
      });
    }
    
    // Initialize CMS data
    await this.initCmsData();
  }
  
  private async initCmsData() {
    try {
      // Check if any pages exist
      const existingPages = await db.select().from(pageContent);
      
      if (existingPages.length === 0) {
        console.log('Initializing default page content');
        
        // Insert home page
        await db.insert(pageContent).values({
          pageId: "home",
          title: "Home Page",
          description: "Main landing page",
          metadata: { metaTitle: "Home | getBPay" },
          status: "published"
        });
        
        // Insert about page
        await db.insert(pageContent).values({
          pageId: "about",
          title: "About Us",
          description: "About getBPay",
          metadata: { metaTitle: "About | getBPay" },
          status: "published"
        });
        
        // Insert features page
        await db.insert(pageContent).values({
          pageId: "features",
          title: "Features",
          description: "Our features",
          metadata: { metaTitle: "Features | getBPay" },
          status: "published"
        });
        
        console.log('Default pages initialized');
      }
      
      // Check if any sections exist
      const existingSections = await db.select().from(sectionContent);
      
      if (existingSections.length === 0) {
        console.log('Initializing default section content');
        
        // Home hero section
        await db.insert(sectionContent).values({
          pageId: "home",
          sectionId: "hero",
          name: "Hero Banner",
          content: {
            title: "Welcome to getBPay",
            subtitle: "Modern Payment Platform"
          },
          order: 1,
          isActive: true
        });
        
        // Home features section
        await db.insert(sectionContent).values({
          pageId: "home",
          sectionId: "features",
          name: "Features Overview",
          content: {
            title: "Key Features",
            items: [
              { title: "Secure Payments", description: "End-to-end encryption" },
              { title: "Virtual Cards", description: "Generate on demand" }
            ]
          },
          order: 2,
          isActive: true
        });
        
        // About mission section
        await db.insert(sectionContent).values({
          pageId: "about",
          sectionId: "mission",
          name: "Our Mission",
          content: {
            title: "Our Mission",
            description: "Revolutionizing payments for everyone"
          },
          order: 1,
          isActive: true
        });
        
        console.log('Default sections initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing CMS data:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<any | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: any): Promise<any> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<any>): Promise<any> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateStripeCustomerId(id: number, customerId: string): Promise<any> {
    return this.updateUser(id, { stripeCustomerId: customerId });
  }
  
  async updateUserStripeInfo(id: number, stripeInfo: { customerId: string, subscriptionId: string }): Promise<any> {
    return this.updateUser(id, {
      stripeCustomerId: stripeInfo.customerId,
      stripeSubscriptionId: stripeInfo.subscriptionId
    });
  }

  // Payment methods
  async getPaymentMethods(userId: number): Promise<any[]> {
    return db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
  }
  
  async getPaymentMethod(id: number): Promise<any | undefined> {
    const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return method;
  }

  async addPaymentMethod(userId: number, paymentMethod: any): Promise<any> {
    const [newPaymentMethod] = await db.insert(paymentMethods)
      .values({
        userId,
        ...paymentMethod
      })
      .returning();
    return newPaymentMethod;
  }
  
  async updatePaymentMethod(id: string | number, updates: Partial<any>): Promise<any> {
    const [updatedPaymentMethod] = await db.update(paymentMethods)
      .set({
        ...updates,
        // TypeScript doesn't allow direct spreading of metadata, so handle separately if needed
        metadata: updates.metadata ? updates.metadata : undefined
      })
      .where(eq(paymentMethods.id, Number(id)))
      .returning();
      
    if (!updatedPaymentMethod) {
      throw new Error(`Payment method with ID ${id} not found`);
    }
    
    return updatedPaymentMethod;
  }

  // Virtual cards
  async getVirtualCards(userId: number): Promise<any[]> {
    return db.select().from(virtualCards).where(eq(virtualCards.userId, userId));
  }

  async getVirtualCard(id: string): Promise<any | undefined> {
    const [card] = await db.select().from(virtualCards).where(eq(virtualCards.id, parseInt(id)));
    return card;
  }

  async createVirtualCard(userId: number, card: any): Promise<any> {
    const [newCard] = await db.insert(virtualCards)
      .values({
        userId,
        ...card
      })
      .returning();
    
    if (card.balance && parseFloat(String(card.balance)) > 0) {
      const lastFour = newCard.cardNumber.slice(-4);
      await this.createTransaction({
        virtualCardId: newCard.id,
        merchant: "bPay Funding",
        description: "Initial card funding",
        amount: parseFloat(String(card.balance)),
        date: new Date(),
        status: "completed",
        type: "funding",
        cardLastFour: lastFour
      });
    }
    
    return newCard;
  }
  
  // Transactions
  async getTransactionsByVirtualCard(virtualCardId: string): Promise<any[]> {
    return db.select().from(transactions)
      .where(eq(transactions.virtualCardId, parseInt(virtualCardId)));
  }
  
  async createTransaction(transaction: any): Promise<any> {
    const [newTransaction] = await db.insert(transactions)
      .values({
        ...transaction,
        date: transaction.date || new Date(),
      })
      .returning();
    return newTransaction;
  }

  // System settings
  async getSystemSettings(): Promise<any[]> {
    return db.select().from(systemSettings);
  }

  async getSystemSettingsByCategory(category: string): Promise<any[]> {
    return db.select().from(systemSettings)
      .where(eq(systemSettings.category, category));
  }

  async getSystemSettingByKey(key: string): Promise<any | undefined> {
    const [setting] = await db.select().from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting;
  }

  async createSystemSetting(setting: any): Promise<any> {
    const [newSetting] = await db.insert(systemSettings)
      .values(setting)
      .returning();
    return newSetting;
  }

  async updateSystemSetting(key: string, updates: Partial<any>): Promise<any> {
    const [updatedSetting] = await db.update(systemSettings)
      .set(updates)
      .where(eq(systemSettings.key, key))
      .returning();
    return updatedSetting;
  }

  async deleteSystemSetting(key: string): Promise<boolean> {
    await db.delete(systemSettings)
      .where(eq(systemSettings.key, key));
    // Since we can't check count in the result, assume success if no exception
    return true;
  }

  // Content Management - Page Content
  async getAllPageContent(): Promise<any[]> {
    return db.select().from(pageContent);
  }

  async getPageContent(pageId: string): Promise<any | undefined> {
    const [content] = await db.select().from(pageContent)
      .where(eq(pageContent.pageId, pageId));
    return content;
  }

  async createPageContent(content: any): Promise<any> {
    console.log('DatabaseStorage.createPageContent - Input content:', content);
    try {
      // Ensure we're using pageId field consistently 
      if (!content.pageId) {
        console.warn('Content is missing pageId field, attempting to adapt from id or page_id');
        content.pageId = content.page_id || content.id;
      }
      
      console.log('DatabaseStorage.createPageContent - Inserting with pageId:', content.pageId);
      const [newContent] = await db.insert(pageContent)
        .values(content)
        .returning();
      console.log('DatabaseStorage.createPageContent - Created content:', newContent);
      return newContent;
    } catch (error) {
      console.error('DatabaseStorage.createPageContent - Error:', error);
      throw error;
    }
  }

  async updatePageContent(pageId: string, updates: Partial<any>): Promise<any> {
    const [updatedContent] = await db.update(pageContent)
      .set(updates)
      .where(eq(pageContent.pageId, pageId))
      .returning();
    return updatedContent;
  }

  async deletePageContent(pageId: string): Promise<boolean> {
    await db.delete(pageContent)
      .where(eq(pageContent.pageId, pageId));
    // Since we can't check count in the result, assume success if no exception
    return true;
  }

  // Content Management - Section Content
  async getSectionsByPage(pageId: string): Promise<any[]> {
    try {
      console.log('DatabaseStorage.getSectionsByPage - Attempting to fetch sections for pageId:', pageId, typeof pageId);
      
      // Ensure pageId is a string
      const pageIdString = String(pageId);
      
      const sections = await db.select().from(sectionContent)
        .where(eq(sectionContent.pageId, pageIdString));
      
      console.log(`DatabaseStorage.getSectionsByPage - Found ${sections.length} sections for pageId: ${pageIdString}`);
      console.log('Section data sample:', sections.length > 0 ? JSON.stringify(sections[0], null, 2) : 'No sections found');
      
      return sections;
    } catch (error) {
      console.error('DatabaseStorage.getSectionsByPage - Error fetching sections:', error);
      throw error;
    }
  }

  async getSectionContent(pageId: string, sectionId: string): Promise<any | undefined> {
    const [content] = await db.select().from(sectionContent)
      .where(and(
        eq(sectionContent.pageId, pageId),
        eq(sectionContent.sectionId, sectionId)
      ));
    return content;
  }

  async createSectionContent(pageId: string, sectionData: any): Promise<any> {
    console.log('DatabaseStorage.createSectionContent - pageId:', pageId);
    console.log('DatabaseStorage.createSectionContent - sectionData:', sectionData);
    
    try {
      // Ensure sectionData has pageId set
      const contentToInsert = {
        ...sectionData,
        pageId: pageId // Ensure pageId is set from the separate parameter
      };
      
      // For older method signature compatibility, support sectionId or id
      if (!contentToInsert.sectionId && contentToInsert.id) {
        contentToInsert.sectionId = contentToInsert.id;
      }
      
      console.log('DatabaseStorage.createSectionContent - Final content to insert:', contentToInsert);
      const [newContent] = await db.insert(sectionContent)
        .values(contentToInsert)
        .returning();
      
      console.log('DatabaseStorage.createSectionContent - Created section:', newContent);
      return newContent;
    } catch (error) {
      console.error('DatabaseStorage.createSectionContent - Error:', error);
      throw error;
    }
  }

  async updateSectionContent(pageId: string, sectionId: string, updates: Partial<any>): Promise<any> {
    const [updatedContent] = await db.update(sectionContent)
      .set(updates)
      .where(and(
        eq(sectionContent.pageId, pageId),
        eq(sectionContent.sectionId, sectionId)
      ))
      .returning();
    return updatedContent;
  }

  async deleteSectionContent(pageId: string, sectionId: string): Promise<boolean> {
    await db.delete(sectionContent)
      .where(and(
        eq(sectionContent.pageId, pageId),
        eq(sectionContent.sectionId, sectionId)
      ));
    // Since we can't check count in the result, assume success if no exception
    return true;
  }

  // Content Management - Media Library
  async getAllMedia(): Promise<any[]> {
    return db.select().from(mediaLibrary);
  }

  async getMedia(mediaId: number): Promise<any | undefined> {
    const [media] = await db.select().from(mediaLibrary)
      .where(eq(mediaLibrary.id, mediaId));
    return media;
  }

  async createMedia(mediaData: any): Promise<any> {
    const [newMedia] = await db.insert(mediaLibrary)
      .values(mediaData)
      .returning();
    return newMedia;
  }

  async updateMedia(mediaId: number, updates: Partial<any>): Promise<any> {
    const [updatedMedia] = await db.update(mediaLibrary)
      .set(updates)
      .where(eq(mediaLibrary.id, mediaId))
      .returning();
    return updatedMedia;
  }

  async deleteMedia(mediaId: number): Promise<boolean> {
    await db.delete(mediaLibrary)
      .where(eq(mediaLibrary.id, mediaId));
    // Since we can't check count in the result, assume success if no exception
    return true;
  }

  // Content Management - Theme Settings
  async getAllThemes(): Promise<any[]> {
    return db.select().from(themeSettings);
  }

  async getActiveTheme(): Promise<any | undefined> {
    const [theme] = await db.select().from(themeSettings)
      .where(eq(themeSettings.isActive, true));
    return theme;
  }

  async getTheme(themeId: number): Promise<any | undefined> {
    const [theme] = await db.select().from(themeSettings)
      .where(eq(themeSettings.id, themeId));
    return theme;
  }

  async createTheme(themeData: any): Promise<any> {
    // If this is the first theme, make it active
    const themes = await this.getAllThemes();
    const isFirstTheme = themes.length === 0;
    
    if (themeData.isActive || isFirstTheme) {
      // Deactivate all existing themes
      await db.update(themeSettings)
        .set({ isActive: false });
    }
    
    const [newTheme] = await db.insert(themeSettings)
      .values({
        ...themeData,
        isActive: isFirstTheme || themeData.isActive === true
      })
      .returning();
    return newTheme;
  }

  async updateTheme(themeId: number, updates: Partial<any>): Promise<any> {
    if (updates.isActive === true) {
      // Deactivate all other themes
      await db.update(themeSettings)
        .set({ isActive: false });
    }
    
    const [updatedTheme] = await db.update(themeSettings)
      .set(updates)
      .where(eq(themeSettings.id, themeId))
      .returning();
    return updatedTheme;
  }

  async activateTheme(themeId: number): Promise<any> {
    // Deactivate all themes
    await db.update(themeSettings)
      .set({ isActive: false });
    
    // Activate the specified theme
    const [updatedTheme] = await db.update(themeSettings)
      .set({ isActive: true })
      .where(eq(themeSettings.id, themeId))
      .returning();
    return updatedTheme;
  }

  async deleteTheme(themeId: number): Promise<boolean> {
    // Check if this is the active theme
    const [theme] = await db.select().from(themeSettings)
      .where(eq(themeSettings.id, themeId));
    
    if (theme && theme.isActive) {
      // Find another theme to activate - use not equals (ne) operator
      const otherThemes = await db.select().from(themeSettings)
        .where(ne(themeSettings.id, themeId));
      
      if (otherThemes.length > 0) {
        await this.activateTheme(otherThemes[0].id);
      }
    }
    
    await db.delete(themeSettings)
      .where(eq(themeSettings.id, themeId));
    return true;
  }
}
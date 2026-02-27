import { describe, it, expect } from '@jest/globals';
import { PRIZES } from '../../src/models/Ticket.js';

describe('Ticket Model - PRIZES', () => {
  describe('PRIZES configuration', () => {
    it('should have 5 prize types', () => {
      expect(Object.keys(PRIZES)).toHaveLength(5);
    });

    it('should have INFUSEUR prize', () => {
      expect(PRIZES.INFUSEUR).toBeDefined();
      expect(PRIZES.INFUSEUR.id).toBe('infuseur');
      expect(PRIZES.INFUSEUR.value).toBe(10);
      expect(PRIZES.INFUSEUR.percentage).toBe(60);
    });

    it('should have THE_DETOX prize', () => {
      expect(PRIZES.THE_DETOX).toBeDefined();
      expect(PRIZES.THE_DETOX.id).toBe('the_detox');
      expect(PRIZES.THE_DETOX.value).toBe(15);
      expect(PRIZES.THE_DETOX.percentage).toBe(20);
    });

    it('should have THE_SIGNATURE prize', () => {
      expect(PRIZES.THE_SIGNATURE).toBeDefined();
      expect(PRIZES.THE_SIGNATURE.id).toBe('the_signature');
      expect(PRIZES.THE_SIGNATURE.value).toBe(25);
      expect(PRIZES.THE_SIGNATURE.percentage).toBe(10);
    });

    it('should have COFFRET_39 prize', () => {
      expect(PRIZES.COFFRET_39).toBeDefined();
      expect(PRIZES.COFFRET_39.id).toBe('coffret_39');
      expect(PRIZES.COFFRET_39.value).toBe(39);
      expect(PRIZES.COFFRET_39.percentage).toBe(6);
    });

    it('should have COFFRET_69 prize', () => {
      expect(PRIZES.COFFRET_69).toBeDefined();
      expect(PRIZES.COFFRET_69.id).toBe('coffret_69');
      expect(PRIZES.COFFRET_69.value).toBe(69);
      expect(PRIZES.COFFRET_69.percentage).toBe(4);
    });

    it('should have percentages that sum to 100', () => {
      const totalPercentage = Object.values(PRIZES).reduce(
        (sum, prize) => sum + prize.percentage,
        0
      );
      expect(totalPercentage).toBe(100);
    });

    it('should have required fields for each prize', () => {
      Object.values(PRIZES).forEach((prize) => {
        expect(prize.id).toBeDefined();
        expect(prize.name).toBeDefined();
        expect(prize.description).toBeDefined();
        expect(prize.value).toBeDefined();
        expect(prize.percentage).toBeDefined();
        expect(prize.image).toBeDefined();
      });
    });
  });
});

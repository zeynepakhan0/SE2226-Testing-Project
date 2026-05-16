package week1;


import java.util.Random;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import week1.version4.Pandigital;

import static org.junit.jupiter.api.Assertions.*;


class PandigitalTest {


    static Random rand;

    @BeforeAll
    @DisplayName("Init Random")
    static void createRandom() {
        System.out.println("This method run before all other tests");
        rand = new Random();
    }

    @Test
    void isPrime() {
        assertTrue(Pandigital.isPrime(2));
        assertFalse(Pandigital.isPrime(6));
    }

    @Test
    void isUnique() {
    }

    @Test
    void isValidInput() {
    }

    @Test
    void isPandigital() {
    }
}

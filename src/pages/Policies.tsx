import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Policies = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Policies & Terms
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Everything you need to know about our rental terms, cancellation policy, and service agreements
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="rental-period">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                1. Rental Period
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  The rental period begins on the day the sauna is installed. The subscription is billed monthly on a set date and will automatically renew unless canceled by the Renter according to the terms outlined in the Cancellation Policy.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="insurance">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Optional Insurance Coverage
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p className="font-semibold text-foreground">$30.00 per month</p>
                <p>
                  The Renter may elect to purchase insurance coverage provided by the Owner for an additional monthly fee. This coverage applies solely to damage resulting from natural events (including earthquake, flooding, windstorm, or wildfire smoke), and does not cover damage caused by negligence, misuse, unauthorized modifications, or failure to follow provided instructions.
                </p>
                <p>
                  If elected, this coverage limits the Renter's liability for such covered events to the amount of the Security Deposit. Without this coverage, the Renter remains fully liable for repair or replacement costs arising from any cause.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fees">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Fees & Deposits
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-2">Refundable Security Deposit</p>
                  <p>$500.00, due upon delivery. The deposit will be refunded within 14 days of the sauna pickup date, provided no damages or unpaid balances exist.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">Reservation Fee</p>
                  <p>$150.00, due upon signing this Agreement.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">Delivery Fee</p>
                  <p>$150.00 for any installations outside of San Francisco, due upon signing this Agreement.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">Moving Fee</p>
                  <p>If the Renter requests the sauna to be relocated during the rental period, a moving fee will apply:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Moves within San Francisco: $150</li>
                    <li>Moves where the starting and/or ending location is outside of San Francisco: $300</li>
                  </ul>
                  <p className="mt-2">All moving fees are due prior to the scheduled relocation. The sauna may not be moved by the Renter or any third party without the Owner's written consent.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">Flight Charge</p>
                  <p>$50.00 per flight of stairs (no charge for elevators), due upon delivery.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">Taxes</p>
                  <p>Applicable sales tax will be added to all rental fees, deposits, and service charges in accordance with California law. The Renter agrees to pay all such taxes at the time of billing.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">Advance Rent</p>
                  <p>The first and last month's rental fees are due upon delivery, in addition to the security deposit and any applicable delivery or flight charges.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                2. Payment Method
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  All rental fees, deposits, and service charges shall be paid by ACH transfer or other direct bank transfer method approved by the Owner. If the Renter elects to pay by credit card, an additional processing fee of 3% of the total payment amount will be added to each transaction to cover third-party processing costs. This fee is non-refundable.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="delivery">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                3. Delivery and Setup
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  The sauna will be delivered and set up by the Owner. The Renter agrees not to move the sauna without prior written approval from the Owner.
                </p>
                <p>
                  If extension cords, adapters, or other equipment are required to complete the installation specific to the Renter's space, the cost of such equipment will be passed on to the Renter. The Owner will provide notice of the required items prior to installation whenever possible.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="utilities">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                4. Utilities
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  The Renter is solely responsible for providing adequate water and electrical supply to operate the sauna / cold plunge. The Owner is not responsible for utility costs, outages, or damage caused by insufficient utilities.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancellation">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                5. Cancellation & Refund Policy
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-2">a. Pre-Delivery Cancellation</p>
                  <p>
                    Upon execution of this Agreement and payment of the Reservation Fee, a unit is reserved exclusively for the Renter and removed from availability to other prospective renters. If the Renter cancels this Agreement prior to delivery, the Reservation Fee shall be non-refundable and the Renter shall also be liable for a Cancellation Fee equal to the lesser of:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>(a) one thousand five hundred dollars ($1,500) or</li>
                    <li>(b) fifty percent (50%) of the rental fees for the Initial Commitment Period</li>
                  </ul>
                  <p className="mt-2">This fee reflects the Owner's costs in reserving and preparing equipment, as well as lost business opportunities.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">b. Initial Commitment Period</p>
                  <p>
                    By selecting a rental term length, the Renter acknowledges and agrees that they are committing to pay the full rental fees for that entire initial term ("Initial Commitment Period"). Early cancellation by the Renter does not relieve them of the obligation to pay all rental fees due for the Initial Commitment Period.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">c. Post-Commitment Cancellation</p>
                  <p>
                    After the Initial Commitment Period ends, the subscription will convert to a month-to-month rental at the same monthly rate, automatically renewing unless canceled by the Renter. To cancel after the Initial Commitment Period, the Renter must notify the Owner at least thirty (30) days prior to the next billing date. If notification is given less than thirty (30) days prior, the subscription will renew for one additional billing cycle.
                  </p>
                  <p className="mt-2">Note: If the Renter requests pickup with less than one month's notice, rush pickup fees may apply (see "Return of Sauna").</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">d. Refunds</p>
                  <p>No refunds will be provided for partial months, unused services, or early termination of the Initial Commitment Period.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="modifications">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                6. Modifications
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  The Owner reserves the right to modify the terms of this Agreement with 30 days' notice to the Renter. The Renter may cancel the subscription if they disagree with the new terms, following the Cancellation Policy.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment-failures">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                7. Payment Failures
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  Failed payments may result in suspension of services until payment is resolved. A late fee of $50 will be applied if the payment is more than 5 days late.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="termination">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                8. Termination by Owner
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  The Owner may terminate the subscription for violations of the terms outlined in this Agreement or for non-payment. Upon termination, the sauna must be returned immediately.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="liability">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                9. Liability and Indemnity
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>Renter uses sauna at their own risk. Owner is not liable for injuries, damages, or losses during the rental, including injuries to third parties (such as guests).</p>
                <p>The Renter agrees to use the sauna in accordance with all provided instructions and acknowledges that misuse or negligence may result in damages or personal injury.</p>
                <p>The Owner is not responsible for any damage caused to the Renter's property during the sauna's use unless caused by the Owner's negligence.</p>
                <p>Renter understands their personal renter's or homeowner's insurance may cover damages or injuries, and that Owner does not provide insurance.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="damages">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                10. Renter's Responsibility for Damages
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>The Renter is responsible for any damage to the sauna beyond normal wear and tear.</p>
                <p>The cost of repairs or replacement for any damages will be deducted from the security deposit. If damages exceed the deposit amount, the Renter agrees to pay the remaining balance within 14 days of receiving an invoice.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="prohibited">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                11. Prohibited Uses
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>The Renter agrees not to:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Sublease or transfer the sauna to another party without the Owner's written consent</li>
                  <li>Use the sauna for any unlawful or hazardous purposes</li>
                  <li>Move or transport the sauna without the Owner's written consent</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="return">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                12. Return of Sauna
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>At the end of the rental period, the Renter agrees to:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Ensure the sauna is in the same condition as it was upon delivery, except for normal wear and tear</li>
                  <li>Allow the Owner to retrieve the sauna on the agreed-upon End Date</li>
                </ul>
                
                <div className="mt-4">
                  <p className="font-semibold text-foreground mb-2">Pickup Scheduling and Rush Requests:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Pickups are typically scheduled at least thirty (30) days in advance</li>
                    <li>If the Renter requests pickup with less than thirty (30) days' notice, the Owner may charge a Rush Pickup Fee of up to $150.00</li>
                    <li>If pickup is requested with seven (7) days' notice or less, the Owner may charge a Short-Notice Pickup Fee of up to $250.00</li>
                  </ul>
                  <p className="mt-2">Rush fees are intended to cover the additional costs of rearranging delivery schedules or staffing on short notice.</p>
                  <p>The Owner may, at their discretion, waive or reduce these fees or accommodate earlier pickup at no charge if scheduling permits.</p>
                  <p>All pickup fees, if applicable, are due prior to or at the time of pickup.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="buyout">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Buyout Option
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>At the conclusion of the rental period, the Renter may elect to purchase the rented sauna from the Owner.</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Infrared Sauna Buyout Price: $3,699</li>
                  <li>Finnish Sauna Buyout Price: $6,999</li>
                </ul>
                <p className="mt-2">This option is available only after the rental period ends. Lease payments do not apply toward the purchase price. All sales are final and subject to applicable sales tax.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="joint-liability">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                13. Joint and Several Liability
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  If there is more than one Renter listed in this Agreement, all Renters agree to be jointly and severally liable for all obligations under this Agreement. This means that each Renter is individually and collectively responsible for:
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Payment of all rental fees and charges</li>
                  <li>Repair costs for damages to the sauna</li>
                  <li>Adherence to all terms and conditions of this Agreement</li>
                </ol>
                <p className="mt-2">The Owner reserves the right to pursue any or all Renters for any outstanding amounts or breaches of the Agreement.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="credit-reporting">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                14. Credit Reporting Authorization
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  The Renter acknowledges and agrees that non-payment of rental fees may be reported to credit bureaus and collection agencies. By signing this Agreement, the Renter authorizes the Owner to share payment history, including late or missed payments, with third-party credit reporting agencies and collection services. This may impact the Renter's credit score.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="personal-guarantee">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                15. Personal Guarantee
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  The undersigned Renter agrees to be personally liable for all payments due under this Agreement. If payments are not made in full, the Owner reserves the right to pursue the Renter for the full amount due, including collection and legal fees.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="collections">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                16. Collections and Legal Action
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  In the event of non-payment, the Renter acknowledges that unpaid amounts may be forwarded to a collections agency. The Renter agrees to pay all costs associated with the collection of unpaid amounts, including legal fees and court costs if necessary.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="governing-law">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                17. Governing Law
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>This Agreement shall be governed by the laws of the State of California.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="entire-agreement">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                18. Entire Agreement
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements. Any amendments must be made in writing and signed by both parties. If any part of this Agreement is found invalid, the rest will remain in effect.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Privacy Policy
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  We collect only the information necessary to provide our rental services, including your name, contact information, and payment details. We never sell your personal information to third parties.
                </p>
                <p>
                  Your information is used solely for service delivery, communication, and billing purposes. We maintain industry-standard security practices to protect your data.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 p-6 bg-muted rounded-lg text-center">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Questions about our policies?</h3>
            <p className="text-muted-foreground mb-4">
              We're here to help clarify any terms or answer questions about your rental agreement.
            </p>
            <a 
              href="/contact" 
              className="text-primary hover:underline font-semibold"
            >
              Contact us →
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Policies;
